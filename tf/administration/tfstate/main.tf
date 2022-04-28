terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

provider "aws" {
  region = "us-east-2"
}


###############################################################################
# Resources
###############################################################################

# S3 bucket to store the state
resource "aws_s3_bucket" "state" {
  bucket = "tfstate.state"
}

# Ensure the S3 bucket is private
resource "aws_s3_bucket_acl" "state" {
  bucket = aws_s3_bucket.state.id
  acl    = "private"
}

# Ensure the S3 bucket is encrypted
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Ensure the S3 bucket is versioned to have a way out revert state
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lock to ensure mutual exclusion
resource "aws_dynamodb_table" "lock" {
  name           = "tfstate.lock"
  hash_key       = "LockID"
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    ignore_changes = [read_capacity, write_capacity]
  }

  server_side_encryption {
    enabled = true
  }
}
