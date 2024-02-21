Feature: Connect to Alby wallet extension
  Test connecting to bitcoin lightning with Alby and simulating payment

  Scenario: Open the swap site and create Alby wallet extension
    Given Test Browser is opened - FA
    When New Alby wallet extension page is opened - FA
    And Temp Mail page is opened and sign up with email - FA
    Then Input Code sent to inbox - FA
    And Connect Alby Wallet and simulate payment - FA