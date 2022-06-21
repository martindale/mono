environment = "devnet"

# AWS settings
aws_region         = "us-east-2"             # Ohio
aws_vpc_cidr_block = "172.16.0.0/16"         # CIDR block for the environment
aws_ami            = "ami-0b20a80b82052d23f" # NixOS Release 21.11

# Cloudflare settings
cloudflare_account_id = "5b617c1fbdb803e5005c72217e81fa4e" # Portal Defi
cloudflare_zone_id    = "ba211effeeef68e917559f20e8946b87" # portaldefi.zone

# Bitcoin configuration
bitcoin-network  = "regtest"
bitcoin-port     = 20445
bitcoin-rpc-port = 20444

# Ethereum configuration
# - Infura account details in TeamPortal 1Password Vault
#   https://teamportal.1password.com/vaults/g434czrroqcivvee33tyz4lepy/allitems/jakhttx4hqauoyybckfocrqaya
ethereum-url = "https://goerli.infura.io/v3/3f6691a33225484c8e1eebde034b274f"

# Matrix configuration
matrix-url = "https://transport.transport01.raiden.network"

# Raiden configuration
raiden-network      = "goerli"
raiden-node-address = "0xb7f337B1244709aafd9baf50057eD0df934f2076"
raiden-udc-address  = "0xEC139fBAED94c54Db7Bfb49aC4e143A76bC422bB"
raiden-pfs-url      = "https://pfs.transport01.raiden.network "
