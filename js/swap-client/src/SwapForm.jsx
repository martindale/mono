import { useState } from "react";
import { Button, Card, Container, Table, TableRow } from "semantic-ui-react";

function SwapForm({swapId, swapHash, participant, id, secret, setRequest}) {

    const [data, setData] = useState({
        data: {
            uid: swapId,
            state: participant.state
            }
    });

    const onClickOpen = () => {
        fetch('/api/v1/swap', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                swap: { id: swapId },
                party: {
                    id: id,
                    state: Object.assign(participant.state, {secret: secret})
                }
            })
        })
            .then(res => {
                return res.json()
            })
            .then(data => {
                console.log(JSON.stringify(data))
                console.log(`request: ${data.publicInfo.request}`)
                setRequest(data.publicInfo.request)
            })

            .catch(err => console.log(err))
    }

    const onClickCommit = () => {
        fetch('/api/v1/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                swap: { id: swapId },
                party: {
                    id: id,
                    state: participant.state
                }
            })
        })
            .then(res => {
                return res.json()
            })
            .then(data => {
                console.log(JSON.stringify(data))
            })

            .catch(err => console.log(err))

    }

    return (
        <Card fluid>
        <Card.Content>
            <Card.Header>
                Swap UI ({id})
            </Card.Header>
                    <Card.Description>
                        <Table style={{ border: "0px solid rgba(0,0,0,0)" }}>
                            <Table.Row>
                                <Table.Cell>
                                swapHash: 
                                </Table.Cell>
                                <Table.Cell>
                                    <Container style={{ wordWrap: "break-word" }}>
                                        {swapHash}
                                    </Container>
                                </Table.Cell>
                            </Table.Row>
                            <Table.Row>
                                <Table.Cell>
                                swapSecret:
                                </Table.Cell>
                                <Table.Cell>
                                    <Container style={{ wordWrap: "break-word" }}>
                                        {secret}
                                    </Container>
                                </Table.Cell>
                            </Table.Row>
                        </Table>
                        
                    </Card.Description>
            <Button onClick={onClickOpen}>Open Swap</Button>
            <Button onClick={onClickCommit}>Commit Swap</Button>
        </Card.Content>
        </Card>);


}
export default SwapForm;