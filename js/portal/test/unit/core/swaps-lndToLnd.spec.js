/**
 * @fle Behavioral specification for interface to in-progress atomic swaps
 * Testing case of lnd-to-lnd swap
 */

const { expect } = require('chai')
const Order = require('../../../lib/core/order')
const Party = require('../../../lib/core/party')
const Swap = require('../../../lib/core/swap')
const Swaps = require('../../../lib/core/swaps')
const { createHash, randomBytes } = require('crypto')
const ctx = require('../../../lib/core/context')

describe('Swaps', function () {

  const randomSecret = () => randomBytes(32)
  const sha256 = buffer => createHash('sha256').update(buffer).digest('hex')
  const swapSecret = randomSecret()
  const swapHash = sha256(swapSecret)


  /**
   * Tests instantiation behavior
   */
  describe('Instantiation', function () {
    it('must correctly instantiate', function () {
      let swaps = null

      expect(() => { swaps = new Swaps() }).to.not.throw()
      expect(swaps).to.be.an.instanceof(Swaps)
      expect(swaps.swaps).to.be.an.instanceof(Map).that.has.lengthOf(0)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swaps).to.be.sealed
    })
  })

  /**
   * Regular operational behavior testing
   */
  describe('Operation', function () {
    const BASE_ORDER = {
      type: 'limit',
      baseAsset: 'BTC1',
      baseNetwork: 'lightning',
      baseQuantity: 10000,
      quoteAsset: 'BTC2',
      quoteNetwork: 'lightning',
      quoteQuantity: 30000
    }
    const makerOrderProps = Object.assign({
      uid: 'uid0',
      hash: swapHash,
      side: 'ask'
    }, BASE_ORDER)
    const takerOrderProps = Object.assign({
      uid: 'uid1',
      hash: 'taker',
      side: 'bid'
    }, BASE_ORDER)

    const makerOrder = new Order(makerOrderProps)
    const takerOrder = new Order(takerOrderProps)

    // const matchOrderHashes = [makerOrder.hash, takerOrder.hash]
    // const leader = Math.random() < 0.5 ? makerOrder : takerOrder
    // const follower = leader !== makerOrder ? makerOrder : takerOrder
    let swaps, swap
    let party1, party2

    /**
     * Create a fresh swaps instance at the start of the suite
     * @returns {Void}
     */
    before(function () { swaps = new Swaps({}, ctx) })

    /**
     * Destroy the swaps instance at the end of the suite
     * @returns {Void}
     */
    after(function () { swaps = null })

    /**
     * Create a Swap from a pair of matched orders
     */
    it('must create a swap for an matched order pair', async function () {
      swap = await swaps.fromOrders(makerOrder, takerOrder)
      expect(swaps.swaps).to.have.lengthOf(1)
      expect(swaps.swaps.get(swap.id)).to.equal(swap)

      expect(swap).to.be.an.instanceof(Swap)
      expect(swap.id).to.be.a('string').with.lengthOf(64)
      expect(swap.secretHash).to.be.a('string').that.equals(makerOrder.hash)
      expect(swap.status).to.be.a('string').that.equals('created')

      expect(swap.secretHolder).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretHolder).to.be.sealed
      expect(swap.secretHolder.id).to.be.a('string').that.equals('uid0')
      expect(swap.secretHolder.swap).to.be.an.instanceof(Swap).that.equals(swap)
      expect(swap.secretHolder.state).to.equal(null)
      expect(swap.secretHolder.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(swap.secretHolder.isSecretSeeker).to.be.a('boolean').that.equals(false)

      expect(swap.secretSeeker).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretSeeker).to.be.sealed
      expect(swap.secretSeeker.id).to.be.a('string').that.equals('uid1')
      expect(swap.secretSeeker.swap).to.be.an.instanceof(Swap)
      expect(swap.secretSeeker.state).to.equal(null)
      expect(swap.secretSeeker.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(swap.secretSeeker.isSecretSeeker).to.be.a('boolean').that.equals(true)
    })



    /**
     * It must open the atomic swap for the secret seeker
     */
    it('must open a swap for the secret seeker', async function () {
      const STATE = {
        left: {
          client: 'ln-client',
          node: 'lnd',
          request: null,
          clientInfo: {
            cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434b44434341633267417749424167495241506433503431636771636e4a4573712f58376c77596377436759494b6f5a497a6a3045417749774d5445660a4d4230474131554543684d576247356b494746316447396e5a57356c636d46305a575167593256796444454f4d4177474131554541784d4659577870593255770a4868634e4d6a49784d5445334d4449304d7a49355768634e4d6a51774d5445794d4449304d7a4935576a41784d523877485159445651514b45785a73626d51670a595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a54425a4d424d4742797147534d3439416745470a43437147534d3439417745484130494142487a6962316c7449634b69312b65694936315a69486b2f685068526739743930657338334e2f30687055372b6e436c0a37776e7832572f3750312f30596f6c486570794b6b33324675754b54634d5247486b702f714f796a676355776763497744675944565230504151482f424151440a41674b6b4d424d47413155644a51514d4d416f47434373474151554642774d424d41384741315564457745422f7751464d414d4241663877485159445652304f0a42425945464b3873342b576378326459594c464458394364506b314b4e584c544d477347413155644551526b4d474b434257467361574e6c67676c7362324e680a62476876633353434257467361574e6c6767357762327868636931754d53316862476c6a5a594945645735706549494b64573570654842685932746c644949480a596e566d59323975626f6345667741414159635141414141414141414141414141414141414141414159634572423041417a414b42676771686b6a4f505151440a41674e4a41444247416945416b6a67484838556a7a70547179345a4f444d5233425a7a2f4e52673243734c34335063366e7049744b6838434951445078742f700a5a4148616e6763784f384259527a77672b46665179692b747a757648686f666d5653667051413d3d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
            adminMacaroon: '0201036c6e6402f801030a10d30aeb7cddcb80b796524505e51b01cf1201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620f2f4a861768af83b3434a3853869c4da48b4f221ef1e368d8497aa8a8c775195',
            invoiceMacaroon: '0201036c6e640258030a10d10aeb7cddcb80b796524505e51b01cf1201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e12047265616400000620e8c0832550e6813b47e2c975be94d6c47cb9df3c818c598ae71e9e3a0b2b765e',
            socket: 'localhost:10001'
          },
          lnd: {
            admin: null,
            invoice: null
          }
        },
        right: {
          client: 'ln-client',
          node: 'lnd',
          request: null,
          clientInfo: {
            cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416332674177494241674952414c7063504857374d46753633672f336a746a6b77497377436759494b6f5a497a6a3045417749774d5445660a4d4230474131554543684d576247356b494746316447396e5a57356c636d46305a575167593256796444454f4d4177474131554541784d4659577870593255770a4868634e4d6a49784d5445334d4449304e6a517a5768634e4d6a51774d5445794d4449304e6a517a576a41784d523877485159445651514b45785a73626d51670a595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a54425a4d424d4742797147534d3439416745470a43437147534d34394177454841304941424f774c6b357a56644c5130643435326d4a58654e5548614b3937777a6162304344677041796d326f747732324a34310a754a634177796d6c4f71734365695844565673494b30786e664d7a755a6a6d437a6b346d646d796a676355776763497744675944565230504151482f424151440a41674b6b4d424d47413155644a51514d4d416f47434373474151554642774d424d41384741315564457745422f7751464d414d4241663877485159445652304f0a42425945464b6856594c4b3741464d7678636b79494c58656e30584b665332674d477347413155644551526b4d474b434257467361574e6c67676c7362324e680a62476876633353434257467361574e6c6767357762327868636931754d69316862476c6a5a594945645735706549494b64573570654842685932746c644949480a596e566d59323975626f63456677414141596351414141414141414141414141414141414141414141596345724234414244414b42676771686b6a4f505151440a41674e4841444245416942302f4e4e4d77577354633368764536632f717645394641323072712f484951304364314c6b70755a3951514967436f326333594b680a714672654b444735596d4c70716e6f5a67525a54524c5430704b6433634e4467456e303d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
            adminMacaroon: '0201036c6e6402f801030a10ec058bcd4123c430b5ee10d87f74e27b1201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006208df55dfcea33225ac3f21a4d94e64c953fc473ca1b98b43103e38e0cc2e375a2',
            invoiceMacaroon: '0201036c6e640258030a10ea058bcd4123c430b5ee10d87f74e27b1201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e12047265616400000620124ad851188faea671229646d8c1d60e3c43392d8507fa21086c0783f4b42de7',
            socket: 'localhost:10004'
          },
          lnd: {
            admin: null,
            invoice: null
          }
        }
      }
      party2 = await swaps.open({ id: swap.id }, {
        id: swap.secretSeeker.id,
        state: STATE
      })

      expect(swap).to.be.an.instanceof(Swap)
      expect(swap.id).to.be.a('string').with.lengthOf(64)
      expect(swap.secretHash).to.be.a('string').that.equals(makerOrder.hash)
      expect(swap.status).to.be.a('string').that.equals('opening')

      expect(swap.secretHolder).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretHolder).to.be.sealed
      expect(swap.secretHolder.id).to.be.a('string').that.equals('uid0')
      expect(swap.secretHolder.swap).to.be.an.instanceof(Swap).that.equals(swap)
      // expect(swap.secretHolder.state).to.be.an('object').that.deep.equals({ foo: 'bar' })
      expect(swap.secretHolder.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(swap.secretHolder.isSecretSeeker).to.be.a('boolean').that.equals(false)

      expect(swap.secretSeeker).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretSeeker).to.be.sealed
      expect(swap.secretSeeker.id).to.be.a('string').that.equals('uid1')
      expect(swap.secretSeeker.swap).to.be.an.instanceof(Swap)
      expect(swap.secretSeeker.state).to.be.an('object').that.deep.equals(STATE)
      expect(swap.secretSeeker.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(swap.secretSeeker.isSecretSeeker).to.be.a('boolean').that.equals(true)

      // console.log(`party2: ${JSON.stringify(party2)}`)
      expect(party2).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(party2).to.be.sealed
      expect(party2.id).to.be.a('string').that.equals('uid1')
      expect(party2.swap).to.be.an.instanceof(Swap).that.equals(swap)
      // expect(party.state).to.be.an('object').that.deep.equals(STATE)
      expect(party2.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(party2.isSecretSeeker).to.be.a('boolean').that.equals(true)
    })

    /**
     * It must open the atomic swap for the secret holder
     */
    it('must open a swap for the secret holder', async function () {
      const STATE = {
        secret: swapSecret.toString('hex'),
        left: {
          client: 'ln-client',
          node: 'lnd',
          request: null,
          clientInfo: {
            cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a434341637967417749424167495156615872656f4979497161682b492f32416769364a54414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a76624441650a467730794d6a45784d5463774d6a517a4d6a6c61467730794e4441784d5449774d6a517a4d6a6c614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d5442574e68636d39734d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a30444151634451674145387a733755442b7a535661566863652f3658416471715775507575584d7a3439453251774d4542415a6c694a354a2b4b0a5741632b7248524c39723067302f636d7761385035322f6c686f56615169736d77694866654b4f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a466751554f6c4c666b69746968546e4f45532b7a326554427a43693264764177617759445652305242475177596f4946593246796232794343577876593246730a6147397a644949465932467962327943446e4276624746794c5734784c574e68636d397367675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373485141464d416f4743437147534d343942414d430a413067414d455543494245536c59656f35775879586779704d4171336c432b6b4c3070646e793475594b5a4d354f45547174696841694541344332574a30637a0a492b707157664f346859343253634877537a33513937594878475265354f524736554d3d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
            adminMacaroon: '0201036c6e6402f801030a109e93a96a6e3ef1d95d7a79352b1875e91201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620d0031dc573ac7780086b630bc4e665cdbbe5cb027538dc3b5956e280f387b313',
            invoiceMacaroon: '0201036c6e640258030a109c93a96a6e3ef1d95d7a79352b1875e91201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e12047265616400000620cbbe90189957d73ff88c84916a1a30a503762693d3d11cec0df43de8f6cc6b6a',
            socket: 'localhost:10003'
          },
          lnd: {
            admin: null,
            invoice: null
          }
        },
        right: {
          client: 'ln-client',
          node: 'lnd',
          request: null,
          clientInfo: {
            cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416332674177494241674952414a63544243596839796d7a526543504c52316b51467377436759494b6f5a497a6a3045417749774d5445660a4d4230474131554543684d576247356b494746316447396e5a57356c636d46305a575167593256796444454f4d4177474131554541784d4659324679623277770a4868634e4d6a49784d5445334d4449304e6a517a5768634e4d6a51774d5445794d4449304e6a517a576a41784d523877485159445651514b45785a73626d51670a595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a766244425a4d424d4742797147534d3439416745470a43437147534d343941774548413049414249597a30434f382f6c306f2b45696951336d2f6171676e547a7062326f34733934774b417a507661504f696f734b730a766277505a636a37487956423247484a71426679632b2b6e2f63424a714d6a474c486265416b756a676355776763497744675944565230504151482f424151440a41674b6b4d424d47413155644a51514d4d416f47434373474151554642774d424d41384741315564457745422f7751464d414d4241663877485159445652304f0a42425945464d4a7a6c75336a3563566a656a6957354344462f6f53344668346d4d477347413155644551526b4d474b4342574e68636d397367676c7362324e680a624768766333534342574e68636d39736767357762327868636931754d69316a59584a7662494945645735706549494b64573570654842685932746c644949480a596e566d59323975626f6345667741414159635141414141414141414141414141414141414141414159634572423441416a414b42676771686b6a4f505151440a41674e48414442454169427265353265733135744a6b7962744834533245672b7a4b355a6753744f7a336937556675453351483167414967642f41764f7872450a724f4b62476f786e786f2b624169613673736b6831547453636e32775258625a6641733d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
            adminMacaroon: '0201036c6e6402f801030a109f44cce5e110fd694ee8fd415e6f60971201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006207975721088f66ecfabc835e18471d7d42f893ba79163a01a39d951d2226a44a4',
            invoiceMacaroon: '0201036c6e640258030a109d44cce5e110fd694ee8fd415e6f60971201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e12047265616400000620543b9ba43439749a71d0954c4a1a6e5a9aebc079dc3e5a88021f9b468a8e126c',
            socket: 'localhost:10006'
          },
          lnd: {
            admin: null,
            invoice: null
          }
        }
      }
      party1 = await swaps.open({ id: swap.id }, {
        id: swap.secretHolder.id,
        state: STATE
      })

      expect(swap).to.be.an.instanceof(Swap)
      expect(swap.id).to.be.a('string').with.lengthOf(64)
      expect(swap.secretHash).to.be.a('string').that.equals(makerOrder.hash)
      expect(swap.status).to.be.a('string').that.equals('opened')

      expect(swap.secretHolder).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretHolder).to.be.sealed
      expect(swap.secretHolder.id).to.be.a('string').that.equals('uid0')
      expect(swap.secretHolder.swap).to.be.an.instanceof(Swap).that.equals(swap)
      // expect(swap.secretHolder.state).to.be.an('object').that.deep.equals(STATE)
      expect(swap.secretHolder.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(swap.secretHolder.isSecretSeeker).to.be.a('boolean').that.equals(false)

      expect(swap.secretSeeker).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(swap.secretSeeker).to.be.sealed
      expect(swap.secretSeeker.id).to.be.a('string').that.equals('uid1')
      expect(swap.secretSeeker.swap).to.be.an.instanceof(Swap)
      // expect(swap.secretSeeker.state).to.equal(null)
      expect(swap.secretSeeker.isSecretHolder).to.be.a('boolean').that.equals(false)
      expect(swap.secretSeeker.isSecretSeeker).to.be.a('boolean').that.equals(true)

      expect(party1).to.be.an.instanceof(Party)
      /* eslint-disable-next-line no-unused-expressions */
      expect(party1).to.be.sealed
      expect(party1.id).to.be.a('string').that.equals('uid0')
      expect(party1.swap).to.be.an.instanceof(Swap).that.equals(swap)
      // expect(party.state).to.be.an('object').that.deep.equals(STATE)
      expect(party1.isSecretHolder).to.be.a('boolean').that.equals(true)
      expect(party1.isSecretSeeker).to.be.a('boolean').that.equals(false)
    })

    it('must commit the swap for both', async function (){
      await swaps.commit(swap, party2)
      // console.log(`between swap commits`)
      await swaps.commit(swap, party1)
    }).timeout(100000)


  })
})
