const equal = require('assert').deepEqual
const { throws } = require('assert')
const {
  success,
  failure,
  empty,
  isFailure,
  isSuccess,
  isEmpty,
  isFailable,
  payload,
  meta,
  assertSuccess,
  assertSuccessWhich,
  assertSuccessTyped,
  assertFailure,
  assertEmpty,
  anyFailed,
  firstFailure,
  extractPayloads,
  flattenResults,
  makeItFailable,
  hydrate,
} = require('./failable')

describe('success', () => {
  const box = success('foo')
  it('should be a success', () => {
    equal(isSuccess(box), true)
  })
  it('should not be a failure', () => {
    equal(isFailure(box), false)
  })
  it('should not be empty', () => {
    equal(isEmpty(box), false)
  })
  it('should have the correct payload', () => {
    equal(payload(box), 'foo')
  })
  it('should have the correct meta', () => {
    equal(meta(box), undefined)
  })
  it('should return empty if no payload is provided', () => {
    const emptyBox = success()
    equal(isEmpty(emptyBox), true)
  })
  it('should hydrate correctly', () => {
    equal(hydrate(box), { kind: 'success', payload: 'foo' })
  })
})

describe('failure', () => {
  const error = failure('bad')
  it('should not be a success', () => {
    equal(isSuccess(error), false)
  })
  it('should be a failure', () => {
    equal(isFailure(error), true)
  })
  it('should not be empty', () => {
    equal(isEmpty(error), false)
  })
  it('should have the correct payload', () => {
    equal(payload(error), 'bad')
  })
  it('should have the correct meta', () => {
    equal(meta(error), undefined)
  })
  it('should hydrate correctly', () => {
    equal(hydrate(error), { kind: 'failure', payload: 'bad' })
  })
})

describe('empty', () => {
  const missing = empty('meta')
  it('should be a success', () => {
    equal(isSuccess(missing), true)
  })
  it('should not be a failure', () => {
    equal(isFailure(missing), false)
  })
  it('should be empty', () => {
    equal(isEmpty(missing), true)
  })
  it('should have no payload', () => {
    equal(payload(missing), undefined)
  })
  it('should have the correct meta', () => {
    equal(meta(missing), 'meta')
  })
  it('should hydrate correctly', () => {
    equal(hydrate(missing), { kind: 'empty', meta: 'meta' })
  })
})

describe('payload', () => {
  it('should return the payload of a failable', () => {
    const data = 'I am a payload'
    const failable = success(data)
    const result = payload(failable)
    equal(result, data)
  })
})

describe('isFailable', () => {
  it('should pass a success', () => {
    equal(isFailable(success('')), true)
  })
  it('should pass a failure', () => {
    equal(isFailable(failure()), true)
  })
  it('should pass an empty', () => {
    equal(isFailable(empty()), true)
  })
  it('should fail a non-array', () => {
    equal(isFailable({ foo: 'bar' }), false)
    equal(isFailure(undefined), false)
    equal(isSuccess('s'), false)
    equal(isEmpty(7), false)
  })
  it('should fail a non-failable array', () => {
    equal(isFailable([4, 5, 6]), false)
  })
})

describe('assertSuccess', () => {
  it('should pass success', () => {
    assertSuccess(success(''))
  })
  it('should fail failure', () => {
    throws(() => assertSuccess(failure()))
  })
  it('should pass empty', () => {
    assertSuccess(empty())
  })
  it('should pass success with correct payload', () => {
    assertSuccess(success('foo'), 'foo')
  })
  it('should fail success with wrong payload', () => {
    throws(() => assertSuccess(success('foo'), 'bar'))
  })
  it('should pass success with correct boolean payload', () => {
    assertSuccess(success(true), true)
  })
  it('should fail success with wrong boolean payload', () => {
    throws(() => assertSuccess(success(true), false))
    throws(() => assertSuccess(success(false), true))
  })
})

describe(`assertSuccessWhich`, () => {
  it('should fail failure', () => {
    throws(() => assertSuccessWhich(p => true, failure()))
  })
  it('should pass success with correct payload', () => {
    assertSuccessWhich(p => p.length === 3, success('foo'))
  })
  it('should not choke on circular object', () => {
    var circle = {}
    circle.a = circle
    assertSuccessWhich(p => true, success(circle))
    assertSuccess(success(circle))
  })
  it('should fail success with wrong payload', () => {
    throws(() => assertSuccessWhich(p => p.length === 4, success('foo')))
  })
})

describe(`assertSuccessTyped`, () => {
  it('should fail failure', () => {
    throws(() => assertSuccessTyped('string', failure()))
  })
  it('should pass success with correct payload', () => {
    assertSuccessTyped('string', success('foo'))
  })
  it('should fail success with wrong payload', () => {
    throws(() => assertSuccessTyped('number', success('foo')))
  })
})

describe('assertFailure', () => {
  it('should fail success', () => {
    throws(() => assertFailure(success('')))
  })
  it('should pass failure', () => {
    assertFailure(failure())
  })
  it('should fail empty', () => {
    throws(() => assertFailure(empty()))
  })
  it('should pass failure with correct payload', () => {
    assertFailure(failure('foo'), 'foo')
  })
  it('should fail failure with wrong payload', () => {
    throws(() => assertFailure(failure('foo'), 'bar'))
  })
  it('should fail failure with wrong boolean payload', () => {
    throws(() => assertFailure(failure(true), false))
    throws(() => assertFailure(failure(false), true))
  })
})

describe('assertEmpty', () => {
  it('should fail success', () => {
    throws(() => assertEmpty(success('')))
  })
  it('should fail failure', () => {
    throws(() => assertSuccess(failure()))
  })
  it('should pass empty', () => {
    assertEmpty(empty())
  })
})

describe('anyFailed', () => {
  it('should return true if list contains a failure', () => {
    const list = [success(''), success(''), empty(), failure()]
    equal(anyFailed(list), true)
  })
  it('should return false if list contains no failures', () => {
    const list = [success(''), success(''), empty(), empty()]
    equal(anyFailed(list), false)
  })
})

describe('firstFailure', () => {
  it('should return the first failure', () => {
    const list = [success(), failure('1'), empty(), failure('2')]
    const first = firstFailure(list)
    equal(payload(first), '1')
  })
})

describe('extractPayloads', () => {
  it(`should extract the payloads`, () => {
    const results = [success('one'), success('two')]
    const payloads = ['one', 'two']
    equal(extractPayloads(results), payloads)
  })
})

describe(`flattenResults`, () => {
  const p1 = { pay: 'load' }
  const p2 = { payl: 'oad' }
  const s1 = success(p1)
  const s2 = success(p2)
  const f1 = failure('rats')
  it(`should return the first failure if any`, () => {
    const flattened = flattenResults([s1, f1])
    assertFailure(flattened, 'rats')
  })
  it(`should return success around an empty list if no results`, () => {
    const flattened = flattenResults([])
    assertSuccess(flattened, [])
  })
  it(`should return success with a list of payloads given a list of successes`, () => {
    const flattened = flattenResults([s1, s2])
    assertSuccess(flattened, [p1, p2])
  })
})

describe('makeItFailable', () => {
  it('should return failable when fn returns one', async () => {
    const expected = success('hello')
    const testFn = async () => expected
    const stillFailable = makeItFailable(testFn)
    const result = await stillFailable()
    equal(result, expected)
  })

  it('should return failable when fn does not return one', async () => {
    const expected = success('hello')
    const testFn = async () => 'hello'
    const nowFailable = makeItFailable(testFn)
    const result = await nowFailable()
    equal(result, expected)
  })

  it('should return a failable if the fn throws an error', async function() {
    const testFn = () => Promise.reject('no work')
    const failableFailure = makeItFailable(testFn)
    const result = await failableFailure()
    assertFailure(result, 'no work')
  })
})
