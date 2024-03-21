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

## Structure & Responsibilities

This section outlines the general structure of the project. While not all components must be used,
classes should generally be placed in the appropriate directory and used in alignment with the conventions 
described below.

### Integration Components

These components are responsible for communication with external APIs. They are divided by the sources they
communicate with and have the following structure:

- **Gateway**: Acts as the point of communication with external infrastructure (APIs).
- **Mapper**: Handles mapping between the domain's used datatype and the request data, utilizing NestJS AutoMapper.
- **Module**: Manages the dependency injection for the component.
- **Spec**: Contains unit tests for the module.
- **Mock**: Provides mock implementations for the module.

### Module Components

Models represent domain-specific business logic flow in the application. Each model is divided into the 
following subcategories:

- **Controller**: The entry point for requests, responsible for handling the request and returning the response.
- **Service**: Contains the main business logic.
- **Mapper**: Manages mapping between DTOs received from the frontend and the business logic domain datatype, using NestJS AutoMapper.
- **Module**: Manages the dependency injection for the component.
- **Interfaces**: For more details, see the **Interfaces** section below.
- **Spec**: Contains unit tests for the module.
- **Mock**: Provides mock implementations for the module.

### Common Components

These are components shared between different modules, addressing common concerns:

- **Interfaces**: Common datatypes used across the application.
- **Enums**: Enums defined for the project.
- **Exceptions**: Custom exceptions tailored for the project.
- **Config**: An injectable configuration service used to manage environment variables.
- **Pipes**: Classes implementing the `PipeTransform` interface, used for common validation 
and transformation of data. NestJS provides many built-in pipes, so check the documentation before creating new ones.
- **Gateway**: Acts as the point of communication with external infrastructure (APIs).
- **Utils**: Contains common utility functions that do not meet the criteria for other categories.
- **Filters**: Classes implementing the `ExceptionFilter` interface, used to handle exceptions.
- **Interceptors**: Used to bind extra logic before or after method execution or to extend the behavior of the method.

### Interfaces

Interfaces are used to define the shape and responsibilities of the data:

- **Dto (Data Transfer Object)**: Data sent from/to the frontend.
- **Command**: Datatype used for data manipulation in business logic.
- **Data**: The shape of data from external APIs.

### Additional Information Regarding Project Structure

- **Mappers**: There are two types of mappers. The first type is domain-specific, used in each module
to distinguish between DTO and Command datatypes. The second type is layer-specific and part of gateway integration. 
This division of responsibilities is intentional, as gateways serve as the gathering point between many domain purposes. 
Domain-specific mappers in this context would be overly convoluted and difficult to configure.
- **Gateway Configuration**: The configuration of the gateways' destination points is located 
in the `gateway-config.service.ts` file.