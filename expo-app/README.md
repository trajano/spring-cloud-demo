# Basic expo app

- [ ] Screen for login
- [ ] Context for authentication

## Note

- I used Fetch API to avoid having another dependency to deal with. In addition it supports SSE.
- The context itself does not useState
- The data is persisted in AsyncStorage

# Directory

- src/components - Pure UI components
- src/contexts - React Contexts
- src/navigation/root - Root navigation
- src/navigation/login - Login navigation
- src/navigation/app - App navigation
- src/init - App Initialization
- src/lib - Internal library module. Each of these should be stand alone

## Concept

```typescript
export Text = createStyledComponent(Animated.Text)
```

When using components only do

```typescript
import { ... } from '@components';
```

## Themes

The idea would be to limit what can be used to keep the styling more consistent.

Button Roles

- destructive
- cancel (triggered on Esc/Back on modal)
- default
- primary (triggered on Enter on modal)

The themes provide colors and fonts that are managed separate in a centralized location.
The effects, padding and layout are done on the components using utility props.

## Key focus areas

- i18n
- themeing
- utility-first styles (like NativeBase/tailwind)

## Simple formatting and utility

Since this is going to be utility, there won't be semantics like headers vs body.

Only support changing to monospaced font, the rest is simple style changes.

```jsx
<Code>Monospaced</Code>
<Underscore><Strong><Em></Em></Strong></Underscore>
<Sub>Subscript</Sub>
<Sup>Superscript</Sup>
```


## Utility props

bg = background color

### Text specific

fg = foreground color
fontFamily
fontWeight
fontStyle
thin = 100
extraLight = 200
light = light text == 300
normal = 400
semiBold = 600
bold = bold text == 700
extraBold = 800
black = 900
italic = italic text
xxs 
xs
s
m = medium size 16px
l
xl
xxl

