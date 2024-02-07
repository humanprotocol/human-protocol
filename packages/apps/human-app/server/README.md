<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest
<h1 align="center">Human APP</h1>
  <p align="center">Human App serves as the entry point to Human Protocol for both workers and Oracle operators.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/blob/main/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg" target="_blank" />
  </a>

</p>

## Structure & Responsibilities: 
This is general structure of the project, not all components must be used, but in general classes should be placed in 
the appropriate directory and used in alignment with convention. 
#### Controller:
In this project one controller will be sufficient to handle all the requests from the frontend.
#### Module components:
Models represent business logic flow in the application. Each model is divided into following subcategories:
- Service - Main business logic class
- Mapper - Mapping between datatype, using nestjs automapper
- Module - Component managing the dependency injection
- Interfaces: see **Interfaces** section
- Spec - Unit tests for the module
#### Common components:
Components shared between different modules and solving common concerns.
- Constants - Mocks, Enum and Error definitions
- Config - Injectable configuration service used to manage environment variables
- Pipes - Classes implementing the `PipeTransform` interface, used for common validation and transformation of data
nest js provides a lot of built-in pipes, check documentation before creating a new one.
- Gateway - Point of communication with external infrastructure (APIs)
- Utils - Common utility functions, that not met any criteria from other categories
- Filters - Classes implementing the `ExceptionFilter` interface, used to handle exceptions
- Interceptors - used to bind extra logic before/after method execution or extend behavior of the method
#### Interfaces:
Interfaces are used to define the shape and responsibility of the data:
- Dto - Data sent from/to frontend
- Command - Datatype used for data manipulation in business logic
- Data - External API data shape
