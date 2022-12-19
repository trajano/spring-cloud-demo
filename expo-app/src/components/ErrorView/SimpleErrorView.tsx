import { ReactElement } from 'react'
import { View } from '../../lib/native-unstyled'
export function SimpleErrorView({ message }: { message: string }): ReactElement<any, any> {
    return (<View bg="red" fg="white"></View>)
}