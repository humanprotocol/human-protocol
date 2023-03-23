## Contributing to HUMAN
We welcome contributions to HUMAN! Here are some guidelines to follow to make the process as smooth as possible.

### Submitting Issues
If you find a bug or have an idea for a new feature, please open an issue on our issue tracker. Before creating a new issue, please do the following:

1. Check for duplicates: Search through the existing issues to make sure someone hasn't already reported the same problem.
2. Make sure that you follow existing templates for new issues:
    * [Bug report](.github/ISSUE_TEMPLATE/bug_report.md)
    * [Feature request](.github/ISSUE_TEMPLATE/feature_request.md)
    * [New feature (dev)](.github/ISSUE_TEMPLATE/devs_feature_request.md)
3. Be clear and concise: Clearly describe the problem you are facing or a new feature that would improve the project.

### Contributing Code
We are always looking for contributions of new features and bugfixes. If you would like to contribute code, please follow these steps:

1. **Fork the repository:** Create a personal copy of the repository on your own account.

2. **Create a new branch:** Create a new branch on your fork to make your changes. It's preferable to create a new branch from `develop`.

3. **Make your changes:** Add new code or make changes to existing code.

4. **Write tests:** We require that all new code is thoroughly tested. Please make sure to write tests for your changes.

5. **Run the tests:** Make sure that all tests pass before submitting your changes.

6. **Create a pull request:** Submit your changes for review by creating a pull request on the main repository. Make sure to follow this [Pull request template](.github/PULL_REQUEST_TEMPLATE.md). 

7. **Sign the CLA:** Sign the contributor License agreement
   
We will review your pull request and provide feedback. If everything looks good, we will merge your changes into the main branch.

### Contributing Code (for the HUMAN team)
We are looking for a clean and meaningful history in the `main` branch. So if you'd like to contribute code, please follow these steps:

1. **Create a new branch** Create a new branch from `develop` branch.

2. **Make your changes** Add new or change the existing code.

3. **Test coverage** Make sure that your changes are thoroughly tested and covered with unit/integration tests.

4. **Create a pull request** Submit your changes for review by creating a pull request on the repository. Make sure to follow this [Pull request template](.github/PULL_REQUEST_TEMPLATE.md) and provide detailed information about changes you made. 
    * Use `develop` as a base branch for PRs with new features.
    * Use `main` branch as a base branch in case you want to merge changes from `develop`

5. **Reviewing pull requests** Whilst reviewing pull request make sure that it meets all the requirements described above (detailed description, passing tests etc.)

6. **Merging pull requests** As mentioned above, we'd like to see a clear and meaningful history on both `develop` and `main` branches. Please, follow these instruction to make it happen:
    * For merging pull requests with `develop` as a base branch: use `squash and merge` option.
    * For merging pull requests with `main` as a base branch: use `create a merge commit` option.

### License

By contributing to HUMAN, you agree to license your contribution under the MIT License.

Thank you for your contribution!
