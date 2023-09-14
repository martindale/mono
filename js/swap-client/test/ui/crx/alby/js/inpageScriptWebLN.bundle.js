(() => { 'use strict'; class e {enabled; isEnabled; executing; constructor () { this.enabled = !1, this.isEnabled = !1, this.executing = !1 } async enable () { if (this.enabled) return { enabled: !0 }; const e = await this.execute('enable'); return typeof e.enabled === 'boolean' && (this.enabled = e.enabled, this.isEnabled = e.enabled), e }getInfo () { if (!this.enabled) throw new Error('Provider must be enabled before calling getInfo'); return this.execute('getInfo') }lnurl (e) { if (!this.enabled) throw new Error('Provider must be enabled before calling lnurl'); return this.execute('lnurl', { lnurlEncoded: e }) }sendPayment (e) { if (!this.enabled) throw new Error('Provider must be enabled before calling sendPayment'); return this.execute('sendPaymentOrPrompt', { paymentRequest: e }) }keysend (e) { if (!this.enabled) throw new Error('Provider must be enabled before calling keysend'); return this.execute('keysendOrPrompt', e) }makeInvoice (e) { if (!this.enabled) throw new Error('Provider must be enabled before calling makeInvoice'); return typeof e !== 'object' && (e = { amount: e }), this.execute('makeInvoice', e) }signMessage (e) { if (!this.enabled) throw new Error('Provider must be enabled before calling signMessage'); return this.execute('signMessageOrPrompt', { message: e }) }verifyMessage (e, r) { if (!this.enabled) throw new Error('Provider must be enabled before calling verifyMessage'); throw new Error('Alby does not support `verifyMessage`') }request (e, r) { if (!this.enabled) throw new Error('Provider must be enabled before calling request'); return this.execute('request', { method: e, params: r }) }execute (e, r) { return (function (e, r, t) { return new Promise((n, a) => { const s = Math.random().toString().slice(4); window.postMessage({ id: s, application: 'LBE', prompt: !0, action: `${e}/${r}`, scope: e, args: t }, '*'), window.addEventListener('message', function r (t) { t.data && t.data.response && t.data.application === 'LBE' && t.data.scope === e && t.data.id === s && (t.data.data.error ? a(new Error(t.data.data.error)) : n(t.data.data.data), window.removeEventListener('message', r)) }) }) }('webln', e, r)) }}document && (window.webln = new e()) })()
