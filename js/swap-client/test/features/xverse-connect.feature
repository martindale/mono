Feature: Connect to Xverse wallet extension
  Test connecting with Xverse Wallet Extension and simulating payment

  Scenario: Connect and Simulate Payment with Xverse
    Given Test Browser is opened - FX
    When Create Xverse Wallet - FX
    Then Connect Xverse Wallet - FX
    And Simulate Xverse Payment - FX
