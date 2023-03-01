# Opinionated Design component library

I just like it this way.  But I may add a few reasonings why.

The basis for the most part is [Fluent UI](https://react.fluentui.dev/) where I sort of like the general flatness because I want focus to be part of the content.  I also dropped any notion of making it look like the platform.

There is less animation that is not driven by user action.  So only "hover", "blur", "focus", "pressing" when you have an indirect input like mouse.  "focus", "pressing" only occurs on touch.

There are two primary components that would be defined: Fields and Buttons

## Fields

Fields (which are actually derived from Material UI because I like that the field names are embedded in the field as it makes better use of screen space) but minus the grow-shrink effect of the label on focus.

## Button

Buttons which are predominantly Fluent UI, but with a few tweaks.
* Focus should not be drawn too much to the button unless it's a CTA.  When you're dealing with form entry, your focus should be the form and not the submit button.
* As such it shouldn't be another eyes drawn in background color.

But that can be done on the usage.  However, the description of "primary" will likely be swapped with "standard" (or undefined), "attention" and "danger" 
