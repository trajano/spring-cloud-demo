# React Native Unstyled

The objective of the library is to add Quality of Life improvements to existing React Native components. It is _not_ a component library per se but can be use as a base for one.

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

    This also handles the scenario for fonts that have no mapped bold and italic such as *Island Moments* and *Lexend*.



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