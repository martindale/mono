set -eu

# Tests needs to be performed in this order to work properly
directories=("core" "portal" "sdk")

for dir in "${directories[@]}"; do
  echo "-------------------------"
  cd "$PORTAL_ROOT/js/$dir"
  echo "Installing deps in $dir..."
  npm install
  echo "Deps installed in $dir completed."
  echo "-------------------------"
done

for dir in "${directories[@]}"; do
  echo "-------------------------"
  cd "$PORTAL_ROOT/js/$dir"
  echo "Running tests in $dir..."
  npm run test
  echo "Tests in $dir completed."
  echo "-------------------------"
done

if [ "$MATRIX_OS" != "macOS-latest" ]; then
  cd $PORTAL_ROOT
  echo "Performing integration tests"
  nix-build --option sandbox false --attr checks.portaldefi.integration-tests.portal
fi
