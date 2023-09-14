Feature: Connect to Alby wallet extension
  Test connecting to bitcoin lightning with Alby and simulating payment

  Scenario: connect and simulate payment with alby wallet
    Given Test Browser is opened - FA
    When Click on Lightning Connect Button - FA
    Then Connect Alby Wallet - FA
    And Simulate Alby Payment - FA
