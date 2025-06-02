#!/bin/bash
set -e

echo "Installing .NET..."
curl -sSf https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 8.0

echo "Setting up PATH..."
export PATH="$HOME/.dotnet:$PATH"
export DOTNET_ROOT="$HOME/.dotnet"

echo "Verifying .NET installation..."
$HOME/.dotnet/dotnet --version

echo "Building Rust WASM..."
cd wwwroot/rust-boids
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
export PATH="$HOME/.cargo/bin:$PATH"
wasm-pack build --target web --out-dir pkg
cd ../..

echo "Building Blazor project..."
$HOME/.dotnet/dotnet publish PortfolioSite.csproj -c Release -o out

echo "Build completed successfully!"