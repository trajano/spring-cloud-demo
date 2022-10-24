# Basic expo app

- [ ] Screen for login
- [ ] Context for authentication

## Note

* I used Fetch API to avoid having another dependency to deal with.  In addition it supports SSE.
* The context itself does not useState
* The data is persisted in AsyncStorage

# Directory 

```
src/components - Pure UI components
src/contexts - React Contexts
src/navigation/root - Root navigation
src/navigation/login - Login navigation
src/navigation/app - App navigation
src/init - App Initialization
src/lib - Internal library module.  Each of these should be stand alone
```
