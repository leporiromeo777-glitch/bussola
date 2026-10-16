// La logica di Bleo (regole del percorso, calcoli, dati con le fonti) sta in
// ../src ed è la stessa del sito: Metro la legge da lì. I pacchetti che quei
// file importano (zod, ...) si cercano anche in mobile/node_modules, perché
// nella build EAS c'è solo quella cartella.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const progetto = __dirname;
const radice = path.resolve(progetto, "..");

const config = getDefaultConfig(progetto);
config.watchFolders = [...(config.watchFolders ?? []), path.join(radice, "src")];
config.resolver.nodeModulesPaths = [path.join(progetto, "node_modules"), ...(config.resolver.nodeModulesPaths ?? [])];

module.exports = config;
