
export const getBTCPrice = async () => {
	const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
	const data = await res.json();
	return data.data.amount;
}
export const getETHPrice = async () => {
	const res = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
	const data = await res.json();
	return data.data.amount;
}
