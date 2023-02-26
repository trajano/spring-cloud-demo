# Expo Unstyled

The objective of the library is to add Quality of Life improvements to existing React Native and Expo components. It is _not_ a component library per se but can be use as a base for one.  This is geared towards Expo and not pure React Native.

Key functions:

- expand `<Text>` to support

  - i18n via i18n-js
    - `_t` is used as the key for the text.
  - support for using `fontFamily` as a family rather than pointing to individual font files. Example:

    > ```jsx
    > <Text style={{ fontFamily: "IBMPlexSans", fontSize: 30 }}>
    >   IBMPlexSans
    >   <Text style={{ fontWeight: "bold" }}>bold</Text>
    >   <Text style={{ fontStyle: "italic" }}>italic</Text>
    > </Text>
    > ```
    >
    > becomes
    >
    > ```jsx
    > <Text style={{ fontFamily: "IBMPlexSans_400Regular", fontSize: 30 }}>
    >   IBMPlexSans
    >   <Text style={{ fontFamily: "IBMPlexSans_700Bold" }}>bold</Text>
    >   <Text style={{ fontFamily: "IBMPlexSans_400Italic" }}>italic</Text>
    > </Text>
    > ```

    This also handles the scenario for fonts that have no mapped bold and italic such as _Island Moments_ and _Lexend_.

- add `<Md>` which is a text that processes limitted markdown formatting. It has the same props as `<Text>` as well. The `_t` can be markdown and will be styled as such.

  - `**bold text**`
  - `*italicized*`
  - `code`
  - `~~strikethru~~`
  - `~subscript~`
  - `^superscript^`
  - `:emoji:`

- It is called unstyled as there are actually no components that
- are styled to look nice. They are left as close to the default
- as possible.
-
- What it provides are wrappers to the React Native core components
- that give extra props for i18n, themeing and utility.

## Loading sequence

The loading sequence comes in three phases...

1. Splash Screen (this is the system splash that gets shown) during this stage, initial assets are loaded. An example of this this would be a simple Lottie animation.
2. Loading Screen Stage 1 shows a component that can only contain the assets used in phase 1. Splash Screen his hidden by now During this time the fonts and remaining assets are loaded. The component is expected to be a View that will be rendered inside another view that provides props containing the root background color of the screen and the asset loading progress (loaded / total) and color scheme as props.
3. Shows the children of the provider.

## breakpoint/media queries

I didn't like the breakpoint system that was employed in Native Base that utilizes arrays since that makes things harder to deal with in terms of typing.  Instead a function is introduced by useTheming to deal with the breakpoints.  The data is still positional in that it takes your definition of breakpoints.  There's built in breakpoints ideally you should set it up according to the 
content you're dealing with (Native-Base did it more from the device standpoint, you can choose to do the same thing there's nothing particularly wrong with that)

```tsx
breakPoints=[]
bp(1) width: 200 => 1
bp(1,2,3) width: 200 => 1
bp(1,2,3) width: 400 => 1

breakPoints=[400]

bp(1,2,3) width: 200 => 1
bp(1,2,3) width: 400 => 2
bp(1) width: 400 => 1

breakPoints=[400, 600]

bp(1,2,3) width: 200 => 1
bp(1,2,3) width: 400 => 2
bp(1,2,3) width: 600 => 3
bp(1,2,3) width: 700 => 3
bp(1,2) width: 600 => 2
bp(1,2) width: 700 => 2


```


## Utility approach

- I looked at styled-components, but it pulls you out of the component too much I find
- I looked at tailwind, but the setup for Expo and Expo web was a bit annoying plus it needed extra tooling.
- I looked at native-base and I actually liked this the best. I don't like the way they had implemented it especially with the non-TypeScript-first approach thus having a general lack of type safety. It had a bit too many "aliases" that you have to look up the meaning for later. Sometimes I just want it to say "32" == 32 pixels no need for extra thinking.

So for the most part I'll just list the distinguishing features over native-base

* This is NOT a component UI framework (I don't have anything that explicitly defines any style past the standard ones, at least not yet, though Button is really tempting me). 
* I am trying to keep my [default theme](https://docs.nativebase.io/default-theme) to a minimum
* This is a theming management tool with i18n support and the styles exposed as props.
    * The themeing management allows to setup aliases for fonts, colors.  However, I *try* stop short of defining what they are.  The design system should allow whatever is needed.
    * I am thinking of some things from https://gridless.design/for-developers where we promote reuse of some values but for sure not go 
* There isn't a single uber theme type (yet, or maybe not).  Instead props on the provider will specify what's needed.  But it may make sense to have some unifying view to have the designer set it up in one go.  I'll think about it.

Note there is a problem with all this concept though in that the stylesheets are not registered so it will have a performance impact.  To reduce it's impact the style props use memoization

One thing to note... unlike the normal react-native View, the View style props do not allow all text style props (namely fontFamily, fontWeight and fontStyle)

## Performance

Eventually some of the HoCs will be converted to a babel plugin to further improve runtime performance but that will come later.

## i18n integration

* Originally I thought to split off the i18n integration but it wasn't possible because I would have to rewrap the components again `withI18n`