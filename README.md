# mono

A polyglot mono-repo powered by the `nix` package manager.

## structure

This repository is organized by language. At the root, is a directory for each language, designated by the file-extension of source code written in the language.

The glue that binds all these languages is Nix: a purely functional package manager that ensures deterministic and reproducible builds.

```
/
/nix - Nix defintions for various services
/tf - Terraform for provisioning infrastructure
```

## getting started

To get started, install nix on your local machine.

```
$ sh <(curl -L https://nixos.org/nix/install)
```

Once installed, you may need to restart your shell session to ensure that `nix` is correctly loaded into your environment. To check, run:

```
$ nix --version
nix (Nix) 2.7.0
```

## portable developer environment

This repository ships with its own portable developer environment that frees developers from having to track down and pin the versions of various development tools/frameworks and elimiate the most common sources of variablility in builds.

To access the developer environment, from the root of the repository run:

```
~github/fabriclabs/mono$ nix-shell

[nix-shell:~/github/fabriclabs/mono]$
```

On your first setup, you will be provided with instructions to setup the required security credentials to be able to perform deployments.

## secure credential access

As of this writing, you need access to third-party service credentials (AWS, Cloudflare, etc.). If you don't already have access to these, please reach out to anand@portaldefi.com to get yourself setup.

## deployments

To deploy infrastructure, navigate to the directory containing the infrastructure to be deployed.

```
[nix-shell:~/github/fabriclabs/mono]$ cd tf/environments/playnet

[nix-shell:~/github/fabriclabs/mono/tf/environments/playnet]$
```

Start out by initializing terraform state.

```
[nix-shell:~/github/fabriclabs/mono/tf/environments/playnet]$ terraform init
Initializing modules...

Initializing the backend...

Initializing provider plugins...
- Reusing previous version of hashicorp/external from the dependency lock file
- Reusing previous version of hashicorp/null from the dependency lock file
- Reusing previous version of hashicorp/tls from the dependency lock file
- Reusing previous version of hashicorp/aws from the dependency lock file
- Reusing previous version of cloudflare/cloudflare from the dependency lock file
- Using previously-installed hashicorp/external v2.2.2
- Using previously-installed hashicorp/null v3.1.1
- Using previously-installed hashicorp/tls v3.1.0
- Using previously-installed hashicorp/aws v4.8.0
- Using previously-installed cloudflare/cloudflare v3.11.0

╷
│ Warning: Experimental feature "module_variable_optional_attrs" is active
│
│   on ../../modules/nixos/main.tf line 7, in terraform:
│    7:   experiments = [module_variable_optional_attrs]
│
│ Experimental features are subject to breaking changes in future minor or patch releases, based on feedback.
│
│ If you have feedback on the design of this feature, please open a GitHub issue to discuss it.
╵

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

Once the terraform state has been initialized, then proceed to generate a plan.

```
[nix-shell:~/github/fabriclabs/mono/tf/environments/playnet]$ terraform plan
tls_private_key.deploy: Refreshing state... [id=d587f86873a640d3d23a348dac1177435b086c4d]
aws_key_pair.playnet: Refreshing state... [id=playnet-deploy_key]
...
...
...
Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the
following symbols:
-/+ destroy and then create replacement

Terraform will perform the following actions:

  # module.aws_configuration["raiden-cli"].null_resource.realization is tainted, so must be replaced
-/+ resource "null_resource" "realization" {
      ~ id       = "3323052538246927146" -> (known after apply)
        # (1 unchanged attribute hidden)
    }

Plan: 1 to add, 0 to change, 1 to destroy.

```

Look over the plan and verify each mutation to be expected with the changes you've made. Once that is done, run `terraform apply` to approve the deployment of the generated plan.
