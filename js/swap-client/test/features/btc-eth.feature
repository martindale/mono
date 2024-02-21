Feature: Perform BTC to ETH swap
  We want to test if we can perform BTC-ETH swap 

  Scenario: Alice & Bob logs in
    Given Alice browser is opened
    And Bob browser is opened
    When Alice clicks on login
    And Bob clicks on login
    # Then Alice logs in
    # And Bob logs in

  Scenario: Alice & Bob Performs Swap
    Given Alice & Bob are logged in
    When Alice creates an order from BTC to ETH
    And Bob creates an order from ETH to BTC
    Then Swap fills and completes
