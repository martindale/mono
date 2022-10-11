#!/usr/bin/env node
const lnService = require('lightning');

const {createHash, randomBytes} = require('crypto');
const {createHodlInvoice, settleHodlInvoice, pay, payViaPaymentRequest } = require('lightning');
const {subscribeToInvoice} = require('lightning');
const {getInvoice} = require('lightning');
const {decodePaymentRequest} = require('lightning');


// Settings from Polar "lightning Network 1"
const ALICE_CERT_1 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a544343416379674177494241674951436c714c506f7567644852456e31676e5a444b764c6a414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a5441650a467730794d6a45774d4459774d544d324e445a61467730794d7a45794d4445774d544d324e445a614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d544257467361574e6c4d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a30444151634451674145787544306b3959344439445a512f51464a4c624b47784b68717678464f7a3272486f5064696a6933477470546e774a480a71664344646e705a6b547250366b6d304266705a643954727734375531494b762b6d61306c4b4f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a4667515534666e5a5768364e434f646f776b39756777797730354a377a574577617759445652305242475177596f4946595778705932574343577876593246730a6147397a644949465957787059325743446e4276624746794c5734334c57467361574e6c67675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373474141454d416f4743437147534d343942414d430a413063414d45514349447650696d6b6873716876474e7a356c2f68524d6d334f4959747a5a704c7176366d4c715569346e6d525a4169426d56474679595252490a4e726343495973537377337342773267776e3863486d776d5a7079634633696539513d3d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const ALICE_ADMIN_MACAROON_1 = '0201036c6e6402f801030a10a02093af3b74a8ff9ed55268619aefaf1201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620d699b6df793dafe393475ac4e9e1cd7ef1eb0f799ccb5fba702d670583b49a55';
const ALICE_INVOICE_MACAROON_1 = '0201036c6e640258030a109e2093af3b74a8ff9ed55268619aefaf1201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e120472656164000006208d280f18bece6e098c1516593eb91858d2ade8b028a15ca969b0c3ba33ebbfa4';
const ALICE_GRPC_HOST_1 = 'localhost:10007';

const CAROL_CERT_1 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416332674177494241674952414d522b49513741516d54655643337864482f5734465577436759494b6f5a497a6a3045417749774d5445660a4d4230474131554543684d576247356b494746316447396e5a57356c636d46305a575167593256796444454f4d4177474131554541784d4659324679623277770a4868634e4d6a49784d4441324d44457a4e6a51325768634e4d6a4d784d6a41784d44457a4e6a5132576a41784d523877485159445651514b45785a73626d51670a595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a766244425a4d424d4742797147534d3439416745470a43437147534d34394177454841304941424b34716d61376b452b78334e7a6f6f646f622b79454e4a645450706e517630394a43306d74496951624836463134530a687251496343746571324d6a3876436e716b536b7a3753442f6553754576536f76684b39562b326a676355776763497744675944565230504151482f424151440a41674b6b4d424d47413155644a51514d4d416f47434373474151554642774d424d41384741315564457745422f7751464d414d4241663877485159445652304f0a42425945464c2b493073736e382f4866355572323966506672535350674a33614d477347413155644551526b4d474b4342574e68636d397367676c7362324e680a624768766333534342574e68636d39736767357762327868636931754e79316a59584a7662494945645735706549494b64573570654842685932746c644949480a596e566d59323975626f6345667741414159635141414141414141414141414141414141414141414159634572426741417a414b42676771686b6a4f505151440a41674e48414442454169424d7233637366694950655246766130766349794b4c6e59425258316364434e544a6549635755792b6662414967524b6430336665610a6f324a4a77354b4a4b32796e4c7a487245656b7932366257365676764a39565276676f3d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const CAROL_ADMIN_MACAROON_1 = '0201036c6e6402f801030a10506eff17b3e7c76eae12a64d1ffbe4e61201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620d9ba78ca4b0c9fb6845d8aae791289bf80fac079bf6f97e1d5313b019d3aaa6a';
const CAROL_INVOICE_MACAROON_1 = '0201036c6e640258030a104e6eff17b3e7c76eae12a64d1ffbe4e61201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e120472656164000006205a9397ed6d398f6a06462403a2b5a02918113f363a7f3757e59a2e7480dd47f6';
const CAROL_GRPC_HOST_1 = 'localhost:10009';

// Settings from Polar "Lighting Network 2"
const ALICE_CERT_2 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416379674177494241674951524d6b375a6844316b7149333272584d372f78446744414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a5441650a467730794d6a45774d4459774d54517a4e446461467730794d7a45794d4445774d54517a4e4464614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d544257467361574e6c4d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a30444151634451674145326f59542b496c6f784956444e516862586a336a704a565845625066615a694b6c47416d574c556e545a41773636596b0a6d2b64644b2f75707845794b3444372b5237564958526c484637763267664978384e504957714f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a466751557a4864376c4163774b735359775a6f477a645369486a514342327377617759445652305242475177596f4946595778705932574343577876593246730a6147397a644949465957787059325743446e4276624746794c5734344c57467361574e6c67675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373477741444d416f4743437147534d343942414d430a413067414d4555434951445853746e41705977527a684b68785375443138513552354964444e776d5973423043717951306c4d42614149674c2f58592f4777570a5558784d72587078635a694656764d424f2b44545978672f506556333250704b686d733d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const ALICE_ADMIN_MACAROON_2 = '0201036c6e6402f801030a10ed50d8c0893eea43ccce0d92bc08f2371201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006204cc947f569bc2083c1e00e495185b2750f19217d252109d348fa8ebebcc27ad4';
const ALICE_INVOICE_MACAROON_2 = '0201036c6e640258030a10eb50d8c0893eea43ccce0d92bc08f2371201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e1204726561640000062045455d078cb586a7c890a54e7e313191bb8b7a6cfa12e9157bba5e69eb4c26c0';
const ALICE_GRPC_HOST_2 = 'localhost:10004';

const CAROL_CERT_2 = '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a544343416379674177494241674951516a662f626b4d3043477035595847734c3961644644414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a76624441650a467730794d6a45774d4459774d54517a4e446461467730794d7a45794d4445774d54517a4e4464614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d5442574e68636d39734d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a304441516344516741453877624d684f39546f67746e2b7476415742656251596f4d466b575935675776715552782b466862713369326b584a690a30663767312b36714b41553246557477773873646d754b7665364949654265686a50684454614f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a466751556655717a416e4e496e6c78726178636866584b38746e52386b7a5577617759445652305242475177596f4946593246796232794343577876593246730a6147397a644949465932467962327943446e4276624746794c5734344c574e68636d397367675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373477741454d416f4743437147534d343942414d430a413063414d45514349474d794766557654334838506265764435697372764a6f666e516e42362f7854484a497a7750494239794e416942536d4869644574544c0a6b6a334d6d556d6b6b51546e6e5761333868336d75424c314463754353487a6833513d3d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a';
const CAROL_ADMIN_MACAROON_2 = '0201036c6e6402f801030a108ea12027c43b328b60e132245aa0e8e51201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006200829561776c47fd4293d1459edffa589b1a849dab1c993e3a18b428936973cc9';
const CAROL_INVOICE_MACAROON_2 = '0201036c6e640258030a108ca12027c43b328b60e132245aa0e8e51201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e1204726561640000062097e6a41eb74d03fdbd24a688d133c12a368b7d8a52766c2de6f677919290eeb9';
const CAROL_GRPC_HOST_2 = 'localhost:10011';


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
  console.log("Carol creates invoice2")
  const request_2 = (await createHodlInvoice(carolInvoice_2)).request;
  console.log("Carol has created invoice2")
  console.log("")
  console.log("Bolt 11 invoice on Lightning Network 2");
  console.log(request_2);
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
