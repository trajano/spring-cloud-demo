import { StyleProps } from "./StyleProps";
import { TextStyleProps } from "./TextStyleProps";

export type StyledProps<T> = StyleProps & T;
export type StyledTextProps<T> = TextStyleProps & StyleProps & T;
