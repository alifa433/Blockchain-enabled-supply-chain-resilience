# Deployment attempt status

The Hardhat deployment script could not be executed because package dependencies are unavailable in this environment:

- `npm` requests to the public registry (for `hardhat` and `@nomicfoundation/hardhat-toolbox`) return `403 Forbidden`, so the necessary packages cannot be installed.
- The repository's `node_modules` and `package.json` were stored as Git LFS pointers, and there is no remote configured to fetch those objects.
- System package manager access is also blocked (e.g., `apt-get update` returns `403 Forbidden`).

Once network access to the package registry or LFS storage is available, run `npm install` and then `npm run deploy` from `backend/` to publish the contracts and regenerate the frontend artifacts.
