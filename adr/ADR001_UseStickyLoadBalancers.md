# Use Sticky Load Balancers

In order to allow players to connect to specific host (EC2 instance) while also obfuscating the underlying hosts, we will utilize the "sticky session" feature of load balancer. Out of the box, this will enable a player to connect to the same host consistently. But, in order for other players to join that player on the same host, we will need to be able to share and set the AWS ALB cookies between users. A proof of concept is required to validate this approach.

## Proof of Concept

1. Create Application Load Balancer
1. Create Target Group with Sticky Session enabled
1. Add 2 instances to target group
1. Create endpoint (`api/ping`) to return something that identifies which instance is being called
1. Create endpoint (`api/set-cookies`) to set the session cookies to values in the request
1. From the client, call the ping endpoint and capture the machine ID and session cookies
1. From a different client (or Incognito), call the ping endpoint again and capture the machine ID and session cookies
1. Call the set-cookies endpoint to switch sessions from one machine to the other.