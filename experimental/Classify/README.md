# Classify

Discord uses class names like `chatContent__5dca8` for most of its CSS classes,
which forces themes to rely either on class names that can change with any Discord update,
or hacks like `[class*="chatContent_"]`.
While the latter is more stable, it cannot distinguish between classes with the same name,
such as `scroller__1f96e`, `scroller__3d071`, and `scroller_f0f183`.
This plugin patches React to automatically add human-readable aliases for these mangled names:
`Channel__chatContent`, `Messages__scroller`, `GuildsSidebar__scroller`, and `GuildChannelsScroller__scroller`,
for the ones mentioned above.

Inside Discord, the original mangled class names are stored in modules like
```js
function(e,t,a){"use strict";e.exports={content:"content__96073",modal:"modal__6a96b"}}
```

*Classify* looks at the keys defined in these modules, compares it with its [list of rules](./spec.json),
and uses this to insert an appropriate prefix. Contributions to this list are greatly welcomed!

## Debugging helpers

To help with creating the rules, *Classify* inserts a few extra classes if
a class module did not match any rules: `u` on everything, and `uN` with a
unique `N` for each individual class module. This can be used with a style like
```css
.u { --debug-color: red; box-shadow: 0 0 2px 1px var(--debug-color) inset !important; }
```
to identify unmatched elements, and the `uN` classes can be used to identify
members of a specific module. To further help with this, *Classify* also adds a
stylesheet with rules like `.u98.u98.u98.u98 {}`[^repeat], which can be used in devtools
to highlight all matches for the selector.

In addition, there is a function `Vencord.Plugins.plugins.Classify.checkConsistency()`
that checks that all rules have found a match. This can produce false negatives if the module hasn't
been used yet; for example the rule for `Forum` will fail if you haven't opened a forum screen
in the current session.

[^repeat]: The repetition is to increase specificity, to make it more easily accessible in devtools.
