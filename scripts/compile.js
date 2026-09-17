import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractPath = path.resolve(__dirname, '../contracts/DecentralizedVoting.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'DecentralizedVoting.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

console.log('Compiling contracts/DecentralizedVoting.sol with solc 0.8.20...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  for (const error of output.errors) {
    console.log(error.formattedMessage);
    if (error.severity === 'error') hasError = true;
  }
  if (hasError) {
    console.error('Compilation failed!');
    process.exit(1);
  }
}

const contract = output.contracts['DecentralizedVoting.sol']['DecentralizedVoting'];
const artifact = {
  contractName: 'DecentralizedVoting',
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
};

const outputDir = path.resolve(__dirname, '../src/contracts');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.resolve(outputDir, 'DecentralizedVoting.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('✔ Compilation successful! Generated artifact: src/contracts/DecentralizedVoting.json');
