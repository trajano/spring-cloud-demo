import { createContext } from 'react'
import { IJwtValidation } from './IJwtValidation';
export const JwtValidationContext = createContext<IJwtValidation>({
    verify: () => Promise.resolve({})
})