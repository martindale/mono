const userStore = {
  currentState: {
    isLoggedIn: false,
    user: null
  },
  listeners: [],
  reducer (action) {
    switch (action.type) {
      case 'SIGN_IN':
        return { user: action.payload, isLoggedIn: true }
      case 'SIGN_OUT':
        return { user: null, isLoggedIn: false }
      default:
        return userStore.currentState
    }
  },
  subscribe (l) {
    userStore.listeners.push(l)
  },
  getSnapshot () {
    return userStore.currentState
  },
  dispatch (action) {
    userStore.currentState = userStore.reducer(action)
    userStore.listeners.forEach((l) => l())
    return action
  }
}

export { userStore }
