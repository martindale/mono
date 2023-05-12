################################################################################
# User Groups - order alphabetically by group name
################################################################################

resource "aws_iam_group" "administrators" {
  name = "Administrators"
  path = "/administrators/"
}

resource "aws_iam_group_membership" "administrators" {
  name  = "administrators"
  group = aws_iam_group.administrators.name
  users = [
    aws_iam_user.anand.name,
    aws_iam_user.manoj.name,
    aws_iam_user.jack.name,
  ]
}


resource "aws_iam_group" "developers" {
  name = "Developers"
  path = "/developers/"
}

resource "aws_iam_group_membership" "developers" {
  name  = "developers"
  group = aws_iam_group.developers.name
  users = [
    aws_iam_user.alexey.name,
    aws_iam_user.anand.name,
    aws_iam_user.casey.name,
    aws_iam_user.farid.name,
    aws_iam_user.jack.name,
    aws_iam_user.manoj.name,
    aws_iam_user.victor.name,
  ]
}


################################################################################
# Users - order alphabetically by username
################################################################################

resource "aws_iam_user" "alexey" {
  name = "alexey"
  path = "/employees/"
  tags = { Name = "Alexey Melnichenko" }
}

resource "aws_iam_user" "anand" {
  name = "anand"
  path = "/employees/"
  tags = { Name = "Anand Suresh" }
}

resource "aws_iam_user" "casey" {
  name = "casey"
  path = "/employees/"
  tags = { Name = "Casey Bowman" }
}

resource "aws_iam_user" "farid" {
  name = "farid"
  path = "/contractors/"
  tags = { Name = "Farid Azizov" }
}

resource "aws_iam_user" "jack" {
  name = "jack"
  path = "/employees/"
  tags = { Name = "Jack Mills" }
}

resource "aws_iam_user" "manoj" {
  name = "manoj"
  path = "/employees/"
  tags = { Name = "Manoj Duggirala" }
}

resource "aws_iam_user" "victor" {
  name = "victor"
  path = "/contractors/"
  tags = { Name = "Victor Wu" }
}


################################################################################
# Service Accounts - order alphabetically by username
################################################################################

resource "aws_iam_user" "terraform" {
  name = "terraform"
  path = "/service_accounts/"
  tags = { Name = "Terraform" }
}
