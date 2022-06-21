# `devnet`

The `devnet` environment is where we develop all Portal services in a safe manner.


## getting started

To get started, reach out to `anand@portaldefi.com` to gain access to the following third-party services:

- AWS Console
- Cloudflare

Once your accounts have been setup, enter the development environment by running `nix-shell` from the root of the repository. If this is your first time entering the development environment, you should see some instructions for setting up the necessary security credentials on your local machine.

```bash
$ nix-shell
Developer environment not setup correctly!
Please setup your environment before proceeding by running:

cat > /Users/anand/.config/portal.conf <<-EOF
# This file sets up the security credentials for needed for
# deploying resources in the Portal Terraform code-base.

# Your settings/credentials go below.
export AWS_ACCESS_KEY_ID='your_aws_access_key_id'
export AWS_SECRET_ACCESS_KEY='your_aws_secret_access_key'

export CLOUDFLARE_EMAIL='your_cloudflare_email_address'
export CLOUDFLARE_API_KEY='your_cloudflare_global_api_key'
EOF
```

This creates the `$HOME/.config/portal.conf` file on your local machine, which is included by `nix` when entering the developer environment, causing your credentials to be made available to `terraform` during the deployment process.

NOTE: Please keep in mind that this process loads security credentials into your shell's environment. This implies that you'd need to take reasonable measures to prevent exposure of these credentials in your shell history, local session logs, etc.


## deployments

Deployments are handled per-environment. To deploy an environment, navigate to the directory of the environment, and run `terraform init` to initialize the required state for `terraform` to be able to run deployments.

```bash
$ nix-shell

[nix-shell:~/github/fabriclabs/mono]$ cd tf/environments/devnet

[nix-shell:~/github/fabriclabs/mono/tf/environments/devnet]$ terraform init
Initializing modules...
...
...
...
Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.

[nix-shell:~/github/fabriclabs/mono/tf/environments/devnet]$
```

Once your terraform state is initialized, you can run `terraform plan` to generate a deployment plan, followed by `terraform apply` to cause the plan to be executed and deployed.
