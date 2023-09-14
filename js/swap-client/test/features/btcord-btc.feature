Feature: Perform a BTCORD to BTC swap
  We want to test if we can perform a BTCORD-BTC swap 

  Scenario: Alice & Bob logs in
    Given Alice browser is opened - F1
    And Bob browser is opened - F1
    When Alice clicks on login - F1
    And Bob clicks on login - F1
    # Then Alice logs in - F1
    # And Bob logs in - F1

  Scenario: Alice & Bob Performs Swap
    Given Alice & Bob are logged in - F1
    When Alice creates an order from BTCORD to BTC - F1
    And Bob creates an order from BTC to BTCORD - F1
    Then Swap fills and completes - F1
