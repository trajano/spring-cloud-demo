import { createContext } from 'react'
import { IAuthenticated as IAuthenticated } from './IAuthenticated';
export const AuthenticatedContext = createContext<IAuthenticated>({
    internalState: [],
    username: "",
    verified: false,
    whoami: () => Promise.resolve({})
})