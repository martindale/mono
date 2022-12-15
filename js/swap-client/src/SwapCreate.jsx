import { useState } from "react";

function SwapCreate({setSwapId, setSwapHash, setSecretSeekerId, setSecretHolderId, setSecret}) {
    const [baseQuantity, setBaseQuantity] = useState(10000)
    const [quoteQuantity, setQuoteQuantity] = useState(30000)



    const [pressed, setPressed] = useState(false);
    const onClick = () => {

        fetch('/api/v1/swap/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                makerOrderProps: {
                    uid: 'uid1',
                    hash: null,
                    side: 'ask',
                    type: 'limit',
                    baseAsset: 'BTC1',
                    baseNetwork: 'lightning',
                    baseQuantity: baseQuantity,
                    quoteAsset: 'BTC2',
                    quoteNetwork: 'lightning',
                    quoteQuantity: quoteQuantity
                },
                takerOrderProps: {
                    uid: 'uid0',
                    hash: null,
                    side: 'bid',
                    type: 'limit',
                    baseAsset: 'BTC1',
                    baseNetwork: 'lightning',
                    baseQuantity: baseQuantity,
                    quoteAsset: 'BTC2',
                    quoteNetwork: 'lightning',
                    quoteQuantity: quoteQuantity
                }
            })
        })
            .then(res => {
                return res.json()
            })
            .then(data => {
                console.log(data.swap.id)
                console.log(`${JSON.stringify(data)}`)
                setSwapId(data.swap.id)
                setSecretSeekerId(data.swap.secretSeeker.id)
                setSecretHolderId(data.swap.secretHolder.id)
                setSecret(data.swapSecret)
                setSwapHash(data.swap.secretHash)
            })

            .catch(err => console.log(err))
    }
    return (
        <>
            <p><button onClick={onClick}>Create Swap</button></p>
            <p><label>Base Quantity: <input type='number' value={baseQuantity} onChange={(evt) => setBaseQuantity(evt.target.value)}/></label></p>
            <p><label>Quote Quantity: <input type='number' value={quoteQuantity} onChange={(evt) => setQuoteQuantity(evt.target.value)}/></label></p>
        </>
    );

}

export default SwapCreate;