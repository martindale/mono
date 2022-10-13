#!/usr/bin/env node

// #!/usr/bin/env nix-shell
// `
// #! nix-shell -i node  -p nodejs-16_x
// `

"use strict";

const lnService = require('lightning');

const {createHash, randomBytes} = require('crypto');
const {createHodlInvoice, settleHodlInvoice, pay, payViaPaymentRequest } = require('lightning');
const {subscribeToInvoice} = require('lightning');
const {getInvoice} = require('lightning');
const {decodePaymentRequest} = require('lightning');


// Settings from Polar "lightning Network 1"
const ALICE_CERT_1 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416379674177494241674951653739654e624135694b767155436c2f65734c6a3944414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a5441650a467730794d6a45774d5445794d5449784d7a6c61467730794d7a45794d4459794d5449784d7a6c614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d544257467361574e6c4d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a3044415163445167414557504651566a744e315a484e703447784341396c713366372f516c6959706b316e396169393863737931335061504b680a4e627473414d3954432b31375249356e366b5144666f5a386251387744714a4c334c2b4456714f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a46675155424c755959326c5646794154484d67686c6f587648797a5751504577617759445652305242475177596f4946595778705932574343577876593246730a6147397a644949465957787059325743446e4276624746794c5734794c57467361574e6c67675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373465141464d416f4743437147534d343942414d430a413067414d4555434944635741456b4a6d5a583048705a34784a427a6a6f796175754771646366664344794e615563594150427a41694541394c69426c5079790a6e4c5052484f3654586165587350783178576b4a766f4e77315574336531584c3256633d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const ALICE_ADMIN_MACAROON_1 = '0201036c6e6402f801030a10253d7f7c2d1d8d0d79749376a266e7241201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620ffa5ce4d61d5439bed13aaef324b21fb85acfaa2a75b1e38db7e9b4ed85e7c48';
const ALICE_INVOICE_MACAROON_1 = '0201036c6e640258030a10233d7f7c2d1d8d0d79749376a266e7241201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e12047265616400000620f0d91772d00773e1ebae59311804d53dd5abe3808fcb6a04b07dacb6c36c9608';
const ALICE_GRPC_HOST_1 = 'localhost:35817';

const CAROL_CERT_1 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a43434163796741774942416749515133426a42784564613251714a66464e584a3861457a414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a76624441650a467730794d6a45774d5445794d5449774e445661467730794d7a45794d4459794d5449774e4456614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d5442574e68636d39734d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a30444151634451674145666f345434584b6638676570484b2f6a4b53375334367870304d34536d4659577364656c6f706f306c6769334c4169630a62765653723943496b374b5934746b56543065396d5453553357456a69387154373751362b614f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a466751556f572b642f476f534d364d65622f6353317433544b55504251616377617759445652305242475177596f4946593246796232794343577876593246730a6147397a644949465932467962327943446e4276624746794c5734794c574e68636d397367675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373465141444d416f4743437147534d343942414d430a413067414d45554349484a4d5041396f74755865396b53596a4f4c614547325266596d45326a76467a5744446151435367466b704169454178554d44642b66490a2f6b6d53354d44727645426a67614663345738673935784b4c6f623377593764382b6f3d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const CAROL_ADMIN_MACAROON_1 = '0201036c6e6402f801030a10053c161359b4f6eb5337c2fd34d730b51201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006208b34d38a709767242844d0bb19974848b71a1db3192088e0b225e981d1fa69fb';
const CAROL_INVOICE_MACAROON_1 = '0201036c6e640258030a10033c161359b4f6eb5337c2fd34d730b51201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e120472656164000006204d9e8538400b7a0d9227fad80268fc73150754c755985861c27e9f929e2a3759';
const CAROL_GRPC_HOST_1 = 'localhost:35819';

// Settings from Polar "Lighting Network 2"
const ALICE_CERT_2 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a434341637967417749424167495145687945302b77586f3679467431524d436734377054414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a5441650a467730794d6a45774d5445794d5449774e446461467730794d7a45794d4459794d5449774e4464614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d544257467361574e6c4d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a3044415163445167414554704348395631664c56736343566572676679633770447869414f2f444c596e2b67476f6b4154506449673036754e590a70766b74654f5946464b6b4a62386f65706b634b77596753657a75796430575635656e5956614f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a466751555975706a3541722f6e786a65395762792b414f413148304a6b525977617759445652305242475177596f4946595778705932574343577876593246730a6147397a644949465957787059325743446e4276624746794c57347a4c57467361574e6c67675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373456741454d416f4743437147534d343942414d430a413067414d4555434951444f344f684274366576545a4f797259397a46767463677a413152516f4d386454415261462b315a524e514149676439633447696d340a58634d66785a573570664f653445694a63764c42337130744b375556324361553242513d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const ALICE_ADMIN_MACAROON_2 = '0201036c6e6402f801030a1004942eb4e2ce5895d689ea9ef37c8b291201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006209d3f972fffc7b7573444b3878196c9330aea0d009ddb0951cf9bbfa7f4292f57';
const ALICE_INVOICE_MACAROON_2 = '0201036c6e640258030a1002942eb4e2ce5895d689ea9ef37c8b291201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e1204726561640000062021611413a34143cf4053bb653ed4893945aa90c6751cd5be9feabc08a9eb0f07';
const ALICE_GRPC_HOST_2 = 'localhost:10005';

const CAROL_CERT_2 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416332674177494241674952414c7364416d6e694655516f615055776a484a2f54556377436759494b6f5a497a6a3045417749774d5445660a4d4230474131554543684d576247356b494746316447396e5a57356c636d46305a575167593256796444454f4d4177474131554541784d4659324679623277770a4868634e4d6a49784d4445784d6a45794d4451335768634e4d6a4d784d6a41324d6a45794d445133576a41784d523877485159445651514b45785a73626d51670a595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a766244425a4d424d4742797147534d3439416745470a43437147534d34394177454841304941424a695a4b555a70424f437747416a46466c57784573706e6548512f464f65323672776d745765394c366950794f78410a32754558565474512f56666f46536657775064445a5861374179746157415a656d456c6f3876756a676355776763497744675944565230504151482f424151440a41674b6b4d424d47413155644a51514d4d416f47434373474151554642774d424d41384741315564457745422f7751464d414d4241663877485159445652304f0a42425945464354354958562b54344b524671547441774f7338436f676a784b414d477347413155644551526b4d474b4342574e68636d397367676c7362324e680a624768766333534342574e68636d39736767357762327868636931754d79316a59584a7662494945645735706549494b64573570654842685932746c644949480a596e566d59323975626f6345667741414159635141414141414141414141414141414141414141414159634572424941417a414b42676771686b6a4f505151440a41674e48414442454169416a786d4c4c787a5935305a6e7a6370726b4754482f646255376856744875554a51697961714b2b76336567496763417a42307261580a554336366a38446b62314e6a385a482b643157314a4c6e58684d7a636f4f4d486352553d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const CAROL_ADMIN_MACAROON_2 = '0201036c6e6402f801030a105fb8c3519e0816edef304f28879741911201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620a35bf0e17cfde16b41f55df38da51cfc4468a77a5b1fbd47d770c96d7dcbabc9';
const CAROL_INVOICE_MACAROON_2 = '0201036c6e640258030a105db8c3519e0816edef304f28879741911201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e120472656164000006207761d9f402a8a905e95daebf1457ad009ff47df7fbe8f8fdb5ef2cd2672c65eb';
const CAROL_GRPC_HOST_2 = 'localhost:10014';



const main = async function () {

  // Lightning Network 1

  const alice_1 = lnService.authenticatedLndGrpc({
    cert: ALICE_CERT_1,
    macaroon: ALICE_ADMIN_MACAROON_1,
    socket: ALICE_GRPC_HOST_1,
  });

  const aliceInvoice_1 = lnService.authenticatedLndGrpc( {
    cert: ALICE_CERT_1,
    macaroon: ALICE_INVOICE_MACAROON_1,
    socket: ALICE_GRPC_HOST_1,
  })

  const carol_1 = lnService.authenticatedLndGrpc({
    cert: CAROL_CERT_1,
    macaroon: CAROL_ADMIN_MACAROON_1,
    socket: CAROL_GRPC_HOST_1,
  });

  const carolInvoice_1 = lnService.authenticatedLndGrpc({
    cert: CAROL_CERT_1,
    macaroon: CAROL_INVOICE_MACAROON_1,
    socket: CAROL_GRPC_HOST_1,
  });

  // Lightning Network 2

  const alice_2 = lnService.authenticatedLndGrpc({
    cert: ALICE_CERT_2,
    macaroon: ALICE_ADMIN_MACAROON_2,
    socket: ALICE_GRPC_HOST_2,
  });

  const aliceInvoice_2 = lnService.authenticatedLndGrpc( {
    cert: ALICE_CERT_2,
    macaroon: ALICE_INVOICE_MACAROON_2,
    socket: ALICE_GRPC_HOST_2,
  })

  const carol_2 = lnService.authenticatedLndGrpc({
    cert: CAROL_CERT_2,
    macaroon: CAROL_ADMIN_MACAROON_2,
    socket: CAROL_GRPC_HOST_2,
  });

  const carolInvoice_2 = lnService.authenticatedLndGrpc({
    cert: CAROL_CERT_2,
    macaroon: CAROL_INVOICE_MACAROON_2,
    socket: CAROL_GRPC_HOST_2,
  });


  // Carol chooses secret, generates hash for swap, and shares hash with orderbook
  const randomSecret = () => randomBytes(32);
  const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
  const swapSecret = randomSecret();
  const swapHash = sha256(swapSecret);

  // Alice chooses secret, generates hash for swap, and shares hash with orderbook.
  // Orderbook drops one of the hashes upon the match, this one, say.
  const swapSecret_unused = randomSecret();
  const swapHash_unused = sha256(swapSecret);

  // Here are the agreed upon quantities for the atomic swap (from orderbook match)
  const quantity_1 = 10000
  const quantity_2 = 20000

  // Since we are using Carol's swap hash, Carol is the secret holder.
  // Carol knows the secret (the pre-image) from the beginning.
  // Alice only finds out the secret at the end, before the last step.
  // There is the secretHolder and the nonSecretHolder, Carol and Alice, respectively

  // the nonSecretHolder, Alice, creates a hold invoice on network 1 using the swap hash as the payment hash.
  aliceInvoice_1.id = swapHash
  aliceInvoice_1.tokens = quantity_1
  console.log("")
  console.log("payment hash on Lightning Network 1");
  console.log(aliceInvoice_1.id);
  console.log("")
  console.log("Alice creates invoice1")
  const request_1 = (await createHodlInvoice(aliceInvoice_1)).request;
  console.log("Alice has created invoice1")
  console.log("")
  console.log("Bolt 11 invoice on Lightning Network 1");
  console.log(request_1);
  console.log("")
  console.log("Alice subscribes to invoice1")
  const subscription_1 = await subscribeToInvoice(aliceInvoice_1);
  console.log("Alice has subscribed to invoice1")

  // Alice sends Carol request_1

  // -------------------------------------------------------------------
  // There are two steps to paying a hold invoice
  //
  // Step #1 - the payer calls the pay() method
  //  - Sometimes we'll call this paymentStepOne in the context of these two separate steps.
  //   We'll also say that the payer has entered the invoice.
  //
  // The pay() method carries out paymentStepOne but waits until paymentStepTwo is carried out before returning (see below).
  //
  // When the payer does this, HTLCs are set up along the payment path.
  // Once the HTLCs reach all the way to the payee,
  // the payee is said to be holding the invoice.
  // Note the pay() method call has not yet returned at this point.
  // All of this, following step #1, is automatically done by the lightning network.
  //
  // Only at this point can the payee then perform step #2 and accept payment. The Hold Invoice stops here to
  // allow her to take this second step herself. A normal invoice would have performed
  // this second step automatically, in addition to having set up the HTLCs.
  //
  // Through the subscription, the payee is alerted to let her know when the HTLCs have reached her
  // so that she can know when she is holding the invoice.
  //
  //
  // Step #2 - the payee calls the settleHodlInvoice() method
  //  - We'll say the payee is accepting the payment, or settling,
  //  or sometimes we'll call this paymentStepTwo in contrast to paymentStepOne.
  //
  // At this point, the hold invoice payment is complete. and the quantity is fully transferred
  // from the payer to the payee on this lightning network.
  //
  // Alternatively, the invoice can be cancelled by calling the cancelHodlInvoice() method,
  // and both payer and payee are back to square zero.

  // NOTE - There is a method invoice.is_paid(), which returns true once the payee settles, just to make things
  // confusing, given that there is a pay() method in step 1 and settling happens in step 2.

  // QUESTION - how does Carol confirm that aliceInvoice_1 uses the swap hash as the payment hash?
  // ANSWER - The hash can be determined from the BOLT #11 invoice
  // -------------------------------------------------------------------




  // Carol is willing now to carry out paymentStepOne on this hold invoice on network 1.
  // This is because Alice won't be able to accept the payment yet since Alice does not know the secret.
  // Carol though carries out paymentStepOne later on in the code here.



  // The secretHolder, Carol, creates a hold invoice on network 2 using the swap hash as the payment hash.

  carolInvoice_2.id = swapHash
  carolInvoice_2.tokens = quantity_2
  console.log("")
  console.log("payment hash on Lightning Network 2");
  console.log(carolInvoice_2.id);
  console.log("")
  console.log("Carol creates invoice2")
  const request_2 = (await createHodlInvoice(carolInvoice_2)).request;
  console.log("Carol has created invoice2")
  console.log("")
  console.log("Bolt 11 invoice on Lightning Network 2");
  console.log(request_2);
  console.log("")
  console.log("Carol subscribes to invoice2")
  const subscription_2 = await subscribeToInvoice(carolInvoice_2);
  console.log("Carol has subscribed to invoice2")
  console.log("");

  // QUESTION - how does Alice confirm that carolInvoice_2 uses the swap hash as the payment hash?
  // ANSWER - The hash can be determined from the BOLT #11 invoice

  await subscription_1.on('invoice_updated', async invoice_1 => {
    if (invoice_1.is_confirmed) {
      console.log("Alice notified about invoice1 via subscription1")
      console.log("INVOICE in N1 PAID and SETTLED")
    }
    // Only actively held invoices can be settled
    if (!invoice_1.is_held) {
      return;
    }
    console.log("Alice notified about invoice1 via subscription1")
    console.log("invoice1 is now held")
    console.log("")
    console.log(invoice_1.id);
    console.log("invoice 1 amount");
    console.log(invoice_1.tokens);
    console.log("")

    // Carol checks to make sure the payment hash for invoice2 is equal to the swap hash

    alice_2.request = request_2;
    const details2 = await decodePaymentRequest(alice_2).catch(reason => console.log(reason));
    console.log("invoice_2 payment hash")
    console.log(details2.id);
    console.log("")
    console.log("swap hash")
    console.log(swapHash)
    console.log("")
    console.log("Are the two hashes equal?")
    console.log(swapHash == details2.id)
    console.log("")

    // Alice does not know the secret initially, so she cannot settle the invoice on network 1.
    //
    // aliceInvoice.secret = secret.toString('hex');
    // await settleHodlInvoice(aliceInvoice);
    //
    // Rather, Alice performs paymentStepOne on invoice_2 in network 2.

    console.log("Alice performs paymentStepOne on invoice2");
    alice_2.request = request_2;
    console.log("")
    const paidInvoice = await payViaPaymentRequest(alice_2).catch(reason => console.log(reason));
    console.log("Alice has performed paymentStepOne on invoice2");
    console.log("and Alice now knows Carol has performed paymentStepTwo on invoice2")
    // Alice, the nonSecretHolder, uses her new knowledge of the secret to claim her funds
    console.log("Alice is performing paymentStepTwo on invoice1")
    aliceInvoice_1.secret = paidInvoice.secret;
    await settleHodlInvoice(aliceInvoice_1);
    console.log("Alice has performed paymentStepTwo on invoice 1");
  });

  await subscription_2.on('invoice_updated', async invoice_2 => {

    if (invoice_2.is_confirmed) {
      console.log("Carol notified about invoice2 via subscription2")
      console.log("INVOICE in N2 PAID and SETTLED")
    }

    if (!invoice_2.is_held) {
      return;
    }
    console.log("Carol notified about invoice2 via subscription2")
    console.log("invoice2 is now held")
    console.log("")
    console.log(invoice_2.id);
    console.log("invoice 2 amount");
    console.log(invoice_2.tokens);
    console.log("")

    console.log("Carol performs paymentStepTwo on invoice2");

    // Carol, the secretHolder, uses her secret to claim the funds
    carolInvoice_2.secret = swapSecret.toString('hex');
    await settleHodlInvoice(carolInvoice_2);
    console.log("Carol has performed paymentStep2 on invoice2")
  });

  // Carol checks to make sure the payment hash for invoice1 is equal to the swap hash

  carol_1.request = request_1;
  const details1 = await decodePaymentRequest(carol_1).catch(reason => console.log(reason));
  console.log("invoice_1 payment hash")
  console.log(details1.id);
  console.log("")
  console.log("swap hash")
  console.log(swapHash)
  console.log("")
  console.log("Are the two hashes equal?")
  console.log(swapHash == details1.id)
  console.log("")
  console.log("invoice_1 expires at")
  console.log(details1.expires_at)
  console.log("")



  // Carol performs paymentStepOne on invoice_1 in network 1
  // since Alice can't settle yet.

  console.log("Carol performs paymentStepOne on invoice1")
  carol_1.request = request_1;
  await payViaPaymentRequest(carol_1).catch(reason => console.log(reason));
  console.log("Carol has performed paymentStepOne on invoice1")
  console.log("and Carol now knows Alice has performed paymentStepTwo on invoice1")

  // Carol's paymentStepOne induces Alice to perform paymentStepOne on invoice_2 in network 2
  // once invoice_1 is held by Alice. (see subscription_1, above)


}

main().catch(reason => console.log(reason));
