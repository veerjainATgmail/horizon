'use strict';
const stripAnsi = require('strip-ansi');
const assert = require('chai').assert;
const NiceError = require('../../src/utils/nice_error');

const fakeFile = `\
some = fake, syntax
next := some(1, 2, 3)
def foo(bar) {
  -- what language is this?
}
`;

describe('NiceError', () => {
  describe('._sourceLine', () => {
    it('should have blue line number and white source text', (done) => {
      const inputs = [
        { src: 'foo bar', line: 2 },
        { src: 'baz wux', line: 200 },
        { src: ' a b c d e', line: 2000 },
      ];
      const expected = [
        '\u001b[34m2:\u001b[39m' + ' ' + '\u001b[37mfoo bar\u001b[39m',
        '\u001b[34m200:\u001b[39m' + ' ' + '\u001b[37mbaz wux\u001b[39m',
        '\u001b[34m2000:\u001b[39m' + ' ' + '\u001b[37m a b c d e\u001b[39m',
      ];
      const results = inputs.map(NiceError._sourceLine.bind(NiceError));
      assert.deepEqual(results, expected);
      done();
    });
  });
  describe('._extractContext', () => {
    it('can get one line of context from the middle', (done) => {
      const line = 3;
      const contextSize = 1;
      const expected = [
        { line: 2, src: 'next := some(1, 2, 3)' },
        { line: 3, src: 'def foo(bar) {' },
        { line: 4, src: '  -- what language is this?' },
      ];
      const results = NiceError._extractContext(fakeFile, line, contextSize);
      assert.deepEqual(results, expected);
      done();
    });
    it('can get a size 2 context', (done) => {
      const line = 3;
      const contextSize = 2;
      const expected = [
        { line: 1, src: 'some = fake, syntax' },
        { line: 2, src: 'next := some(1, 2, 3)' },
        { line: 3, src: 'def foo(bar) {' },
        { line: 4, src: '  -- what language is this?' },
        { line: 5, src: '}' },
      ];
      const results = NiceError._extractContext(fakeFile, line, contextSize);
      assert.deepEqual(results, expected);
      done();
    });
    it('can gets a size 2 context with 1 line below it', (done) => {
      const line = 2;
      const contextSize = 2;
      const expected = [
        { line: 1, src: 'some = fake, syntax' },
        { line: 2, src: 'next := some(1, 2, 3)' },
        { line: 3, src: 'def foo(bar) {' },
        { line: 4, src: '  -- what language is this?' },
      ];
      const results = NiceError._extractContext(fakeFile, line, contextSize);
      assert.deepEqual(results, expected);
      done();
    });
    it('can gets a size 3 context with 0 lines below it', (done) => {
      const line = 1;
      const contextSize = 3;
      const expected = [
        { line: 1, src: 'some = fake, syntax' },
        { line: 2, src: 'next := some(1, 2, 3)' },
        { line: 3, src: 'def foo(bar) {' },
        { line: 4, src: '  -- what language is this?' },
      ];
      const results = NiceError._extractContext(fakeFile, line, contextSize);
      assert.deepEqual(results, expected);
      done();
    });
    it('can gets a size 3 context with 0 lines after it', (done) => {
      const line = 6;
      const contextSize = 3;
      const expected = [
        { line: 3, src: 'def foo(bar) {' },
        { line: 4, src: '  -- what language is this?' },
        { line: 5, src: '}' },
        { line: 6, src: '' },
      ];
      const results = NiceError._extractContext(fakeFile, line, contextSize);
      assert.deepEqual(results, expected);
      done();
    });
    it('returns an empty array if line out of bounds', (done) => {
      const line = 7;
      const contextSize = 3;
      const expected = [];
      const results = NiceError._extractContext(fakeFile, line, contextSize);
      assert.deepEqual(results, expected);
      done();
    });
  });
  describe('.niceString', () => {
    const message = 'Some kinda message';
    const fileName = './fake.dx';
    const line = 2;
    const col = 6;
    let error;
    beforeEach(() => {
      error = new NiceError(message, {
        sourceFile: fileName,
        sourceContents: fakeFile,
        sourceLine: line,
        sourceColumn: col,
        suggestions: [
          'Always call your mother',
          'Never lie to your mother about being robbed in Rio',
        ],
      });
    });
    it('returns a carrot in the right place with source', (done) => {
      error.suggestions = null;
      const expected = `\
Some kinda message

In ./fake.dx, line 2, column 6:
1: some = fake, syntax
2: next := some(1, 2, 3)
        ^
3: def foo(bar) {
4:   -- what language is this?\
`;
      const result = stripAnsi(error.niceString());
      assert.deepEqual(result, expected);
      done();
    });

    it('returns a list of suggestions if present', (done) => {
      error.sourceFile = null;
      const expected = `\
Some kinda message

Suggestions:
 * Always call your mother
 * Never lie to your mother about being robbed in Rio\
`;
      const results = stripAnsi(error.niceString());
      assert.deepEqual(results, expected);
      done();
    });

    it('shows both suggestions and source if present', (done) => {
      error.suggestions.shift();
      error.sourceLine = 5;
      error.sourceColumn = 1;
      const expected = `\
Some kinda message

Suggestion:
 * Never lie to your mother about being robbed in Rio

In ./fake.dx, line 5, column 1:
2: next := some(1, 2, 3)
3: def foo(bar) {
4:   -- what language is this?
5: }
   ^
6: `;
      const results = stripAnsi(error.niceString({ contextSize: 3 }));
      assert.deepEqual(results, expected);
      done();
    });
  });
});
