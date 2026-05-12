// Allow build scripts for native packages
function readPackage(pkg) {
  return pkg
}

module.exports = { hooks: { readPackage } }
