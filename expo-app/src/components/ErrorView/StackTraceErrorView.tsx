import { ReactElement } from 'react'
import { View } from '../../lib/native-unstyled'
export function StackTraceErrorView({ exception }: { exception: Error }): ReactElement<any, any> {
    return (<View bg="red"></View>)
}