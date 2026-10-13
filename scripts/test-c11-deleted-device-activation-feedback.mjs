import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

function compile(file, dependencies) {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, name => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`);
    return dependencies[name];
  });
  return exports;
}

const authority = compile('src/control-plane/client/manager-remote-control-plane-authority.ts', {
  '../../domain/source-types.ts': {},
});
const { managerActivationFailure } = compile('src/debug/manager/manager-activation-feedback.ts', {
  '../../control-plane/client/manager-remote-control-plane-authority.ts': authority,
});
for (const code of ['ACTIVATION_NOT_FOUND', 'ACTIVATION_NOT_PENDING', 'ACTIVATION_KEY_REGISTRATION_INVALID', 'ACTIVATION_SESSION_EXPIRED', 'PERMANENT_KEY_REVOKED']) {
  const message = managerActivationFailure(new Error(code));
  assert.equal(message, managerActivationFailure({ code, message: 'Fixture internal error' }));
  assert.ok(message.length > 30);
  assert.ok(!message.includes(code) && !message.includes('Fixture internal error'));
  assert.ok(!message.includes('Não foi possível confirmar a ativação. Confira os dados'));
}
assert.match(managerActivationFailure(new Error('ACTIVATION_NOT_FOUND')), /Abra novamente o aplicativo com internet/);
assert.match(managerActivationFailure(new Error('ACTIVATION_NOT_FOUND')), /atualize o aplicativo/);
assert.match(managerActivationFailure(new Error('PERMANENT_KEY_REVOKED')), /revogada/);
assert.match(managerActivationFailure(new Error('INVALID_ACTIVATION_KEY')), /não conferem/);
assert.ok(!managerActivationFailure(new Error('Fixture private secret')).includes('Fixture private secret'));
console.log('C89_MANAGER_ACTIVATION_SAFE_ACTIONABLE_FEEDBACK_PASS');
