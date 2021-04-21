# Hello world javascript action
### From the [github tutorial](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action) for testing purpose

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage
```
uses: actions/hello-world-javascript-action@v1.1
with:
  who-to-greet: 'Mona the Octocat'
```

## Compile code

Checking in node_modules directory can cause problems. As an alternative, we use a tool called @vercel/ncc to compile the code and modules into one file used for distribution.
Compile code before commit by running this command:

```ncc build index.js --license licenses.txt```
