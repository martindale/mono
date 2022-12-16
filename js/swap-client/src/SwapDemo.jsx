import { useEffect, useState } from "react";
import { Button, Card, Container, Table, TableRow } from "semantic-ui-react";

import SwapCreate from './SwapCreate.jsx'
import SwapForm from './SwapForm.jsx'

function SwapDemo() {
    const [amountBase, setBase] = useState(null)
    const [amountQuote, setQuote] = useState(null)
    const [swapState, setSwapState] = useState(null)
    const [swapId, setSwapId] = useState(null)
    const [swapHash, setSwapHash] = useState(null)
    const [secretSeekerId, setSecretSeekerId] = useState(null)
    const [secretHolderId, setSecretHolderId] = useState(null)
    const [secret, setSecret] = useState(null)
    const [request1, setRequest1] = useState(null)
    const [request2, setRequest2] = useState(null)
    const [alice, setAlice] = useState({
        state: {
            isSecretHolder: false,
            left: {
                client: 'ln-client',
                node: 'lnd',
                request: null,
                clientInfo: {
                        cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416379674177494241674951653739654e624135694b767155436c2f65734c6a3944414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a5441650a467730794d6a45774d5445794d5449784d7a6c61467730794d7a45794d4459794d5449784d7a6c614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d544257467361574e6c4d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a3044415163445167414557504651566a744e315a484e703447784341396c713366372f516c6959706b316e396169393863737931335061504b680a4e627473414d3954432b31375249356e366b5144666f5a386251387744714a4c334c2b4456714f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a46675155424c755959326c5646794154484d67686c6f587648797a5751504577617759445652305242475177596f4946595778705932574343577876593246730a6147397a644949465957787059325743446e4276624746794c5734794c57467361574e6c67675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373465141464d416f4743437147534d343942414d430a413067414d4555434944635741456b4a6d5a583048705a34784a427a6a6f796175754771646366664344794e615563594150427a41694541394c69426c5079790a6e4c5052484f3654586165587350783178576b4a766f4e77315574336531584c3256633d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
                        adminMacaroon: '0201036c6e6402f801030a10253d7f7c2d1d8d0d79749376a266e7241201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620ffa5ce4d61d5439bed13aaef324b21fb85acfaa2a75b1e38db7e9b4ed85e7c48',
                        invoiceMacaroon: '0201036c6e640258030a10233d7f7c2d1d8d0d79749376a266e7241201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e12047265616400000620f0d91772d00773e1ebae59311804d53dd5abe3808fcb6a04b07dacb6c36c9608',
                        socket: 'localhost:35817'
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
                        cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a434341637967417749424167495145687945302b77586f3679467431524d436734377054414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566862476c6a5a5441650a467730794d6a45774d5445794d5449774e446461467730794d7a45794d4459794d5449774e4464614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d544257467361574e6c4d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a3044415163445167414554704348395631664c56736343566572676679633770447869414f2f444c596e2b67476f6b4154506449673036754e590a70766b74654f5946464b6b4a62386f65706b634b77596753657a75796430575635656e5956614f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a466751555975706a3541722f6e786a65395762792b414f413148304a6b525977617759445652305242475177596f4946595778705932574343577876593246730a6147397a644949465957787059325743446e4276624746794c57347a4c57467361574e6c67675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373456741454d416f4743437147534d343942414d430a413067414d4555434951444f344f684274366576545a4f797259397a46767463677a413152516f4d386454415261462b315a524e514149676439633447696d340a58634d66785a573570664f653445694a63764c42337130744b375556324361553242513d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
                        adminMacaroon: '0201036c6e6402f801030a1004942eb4e2ce5895d689ea9ef37c8b291201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006209d3f972fffc7b7573444b3878196c9330aea0d009ddb0951cf9bbfa7f4292f57',
                        invoiceMacaroon: '0201036c6e640258030a1002942eb4e2ce5895d689ea9ef37c8b291201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e1204726561640000062021611413a34143cf4053bb653ed4893945aa90c6751cd5be9feabc08a9eb0f07',
                        socket: 'localhost:10005'
                    },
                    lnd: {
                        admin: null,
                        invoice: null
                    }
                }
            }
        })
    const [carol, setCarol] = useState({
        state: {
            isSecretHolder: true,
            secret: secret,
            left: {
                client: 'ln-client',
                node: 'lnd',
                request: null,
                clientInfo: {
                        cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a43434163796741774942416749515133426a42784564613251714a66464e584a3861457a414b42676771686b6a4f50515144416a41784d5238770a485159445651514b45785a73626d5167595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a76624441650a467730794d6a45774d5445794d5449774e445661467730794d7a45794d4459794d5449774e4456614d444578487a416442674e5642416f54466d78755a4342680a645852765a3256755a584a686447566b49474e6c636e5178446a414d42674e5642414d5442574e68636d39734d466b77457759484b6f5a497a6a3043415159490a4b6f5a497a6a30444151634451674145666f345434584b6638676570484b2f6a4b53375334367870304d34536d4659577364656c6f706f306c6769334c4169630a62765653723943496b374b5934746b56543065396d5453553357456a69387154373751362b614f4278544342776a414f42674e56485138424166384542414d430a41715177457759445652306c42417777436759494b775942425155484177457744775944565230544151482f42415577417745422f7a416442674e56485134450a466751556f572b642f476f534d364d65622f6353317433544b55504251616377617759445652305242475177596f4946593246796232794343577876593246730a6147397a644949465932467962327943446e4276624746794c5734794c574e68636d397367675231626d6c3467677031626d6c346347466a61325630676764690a64575a6a623235756877522f4141414268784141414141414141414141414141414141414141414268775373465141444d416f4743437147534d343942414d430a413067414d45554349484a4d5041396f74755865396b53596a4f4c614547325266596d45326a76467a5744446151435367466b704169454178554d44642b66490a2f6b6d53354d44727645426a67614663345738673935784b4c6f623377593764382b6f3d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
                        adminMacaroon: '0201036c6e6402f801030a10053c161359b4f6eb5337c2fd34d730b51201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e6572617465120472656164000006208b34d38a709767242844d0bb19974848b71a1db3192088e0b225e981d1fa69fb',
                        invoiceMacaroon: '0201036c6e640258030a10033c161359b4f6eb5337c2fd34d730b51201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e120472656164000006204d9e8538400b7a0d9227fad80268fc73150754c755985861c27e9f929e2a3759',
                        socket: 'localhost:35819'
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
                        cert: '2d2d2d2d2d424547494e2043455254494649434154452d2d2d2d2d0a4d4949434a6a4343416332674177494241674952414c7364416d6e694655516f615055776a484a2f54556377436759494b6f5a497a6a3045417749774d5445660a4d4230474131554543684d576247356b494746316447396e5a57356c636d46305a575167593256796444454f4d4177474131554541784d4659324679623277770a4868634e4d6a49784d4445784d6a45794d4451335768634e4d6a4d784d6a41324d6a45794d445133576a41784d523877485159445651514b45785a73626d51670a595856306232646c626d56795958526c5a43426a5a584a304d51347744415944565151444577566a59584a766244425a4d424d4742797147534d3439416745470a43437147534d34394177454841304941424a695a4b555a70424f437747416a46466c57784573706e6548512f464f65323672776d745765394c366950794f78410a32754558565474512f56666f46536657775064445a5861374179746157415a656d456c6f3876756a676355776763497744675944565230504151482f424151440a41674b6b4d424d47413155644a51514d4d416f47434373474151554642774d424d41384741315564457745422f7751464d414d4241663877485159445652304f0a42425945464354354958562b54344b524671547441774f7338436f676a784b414d477347413155644551526b4d474b4342574e68636d397367676c7362324e680a624768766333534342574e68636d39736767357762327868636931754d79316a59584a7662494945645735706549494b64573570654842685932746c644949480a596e566d59323975626f6345667741414159635141414141414141414141414141414141414141414159634572424941417a414b42676771686b6a4f505151440a41674e48414442454169416a786d4c4c787a5935305a6e7a6370726b4754482f646255376856744875554a51697961714b2b76336567496763417a42307261580a554336366a38446b62314e6a385a482b643157314a4c6e58684d7a636f4f4d486352553d0a2d2d2d2d2d454e442043455254494649434154452d2d2d2d2d0a',
                        adminMacaroon: '0201036c6e6402f801030a105fb8c3519e0816edef304f28879741911201301a160a0761646472657373120472656164120577726974651a130a04696e666f120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a210a086d616361726f6f6e120867656e6572617465120472656164120577726974651a160a076d657373616765120472656164120577726974651a170a086f6666636861696e120472656164120577726974651a160a076f6e636861696e120472656164120577726974651a140a057065657273120472656164120577726974651a180a067369676e6572120867656e657261746512047265616400000620a35bf0e17cfde16b41f55df38da51cfc4468a77a5b1fbd47d770c96d7dcbabc9',
                        invoiceMacaroon: '0201036c6e640258030a105db8c3519e0816edef304f28879741911201301a160a0761646472657373120472656164120577726974651a170a08696e766f69636573120472656164120577726974651a0f0a076f6e636861696e120472656164000006207761d9f402a8a905e95daebf1457ad009ff47df7fbe8f8fdb5ef2cd2672c65eb',
                        socket: 'localhost:10014'
                    },
                    lnd: {
                        admin: null,
                        invoice: null
                    }
                }
            }
        })
        useEffect(() => {
            if(swapHash) setSwapState(1)
            if(request1!=request2 && (request1 | request2)) setSwapState(2)
            if(request1 && request2) setSwapState(3)
            // if() setSwapState(4)
            // if() setSwapState(5)
            // if() setSwapState(6)


        }, [swapHash, request1, request2]);


    return (
        <>
            { (swapId == null) ? 
            (<SwapCreate setSwapId={setSwapId} setSwapHash={setSwapHash} setSecretSeekerId={setSecretSeekerId} setSecretHolderId={setSecretHolderId} setSecret={setSecret} setBase={setBase} setQuote={setQuote}/>) : (
            <Card.Group centered>
                <Card fluid>
                    <Card.Content>
                        <Card.Header>
                            Swap Info
                        </Card.Header>
                        <Card.Description>
                            <Table style={{ border: "0px solid rgba(0,0,0,0)" }}>
                                <Table.Row>
                                    <Table.Cell>
                                        baseAmount: 
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Container style={{ wordWrap: "break-word" }}>
                                            {amountBase}
                                        </Container>
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>
                                        quoteAmount: 
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Container style={{ wordWrap: "break-word" }}>
                                            {amountQuote}
                                        </Container>
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>
                                        swapId: 
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Container style={{ wordWrap: "break-word" }}>
                                            {swapId}
                                        </Container>
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>
                                        invoice1: 
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Container style={{ wordWrap: "break-word" }}>
                                            {request1}
                                        </Container>
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>
                                        invoice2:
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Container style={{ wordWrap: "break-word" }}>
                                            {request2}
                                        </Container>
                                    </Table.Cell>
                                </Table.Row>
                            </Table>

                            <Button onClick={()=>{window.location.reload()}}>Cancel Swap</Button>
                        </Card.Description>
                    </Card.Content>
                </Card>
            </Card.Group>    
            )}

            { (swapId != null) ?
            (<Card.Group widths='equal'>
                <Card fluid>
                    <Card.Content>
                        <SwapForm swapId={swapId} swapHash={swapHash} participant={alice} id={secretSeekerId} setRequest={setRequest1} swapState={swapState}/>
                    </Card.Content>
                </Card>
                <Card fluid>
                    <Card.Content>
                        <SwapForm swapId={swapId} swapHash={swapHash} participant={carol} id={secretHolderId} setRequest={setRequest2} secret={secret} swapState={swapState}/>
                    </Card.Content>
                </Card>
            </Card.Group>)
                : (<br/>)}
        </>);
}

export default SwapDemo;