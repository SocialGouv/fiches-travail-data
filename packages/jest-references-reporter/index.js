const { DefaultReporter } = require("@jest/reporters");
const chalk = require("chalk");
// const ProgressBar = require("progress");

// const passedFmt = chalk.green;
// const failedFmt = chalk.red;
// const pendingFmt = chalk.cyan;
// const titleFmt = chalk.white;
// const headFmt = chalk.white;
// const durationFmt = chalk.gray;
// const infoFmt = chalk.white;

class JestDotReporter extends DefaultReporter {
  printTestFileFailureMessage(_testPath, _config, result) {
    result.failureMessage = formatResultsErrors(result.testResults);
    super.printTestFileFailureMessage(_testPath, _config, result);
  }
}

function formatResultsErrors(testResults) {
  return testResults
    .filter(({ status }) => status === "failed")
    .map(({ancestorTitles, title}) => {
      return (
        "# " +
        chalk.bold.red(ancestorTitles.join("\n  > ") + "\n  " + title) +
        "\n"
      );
    })
    // .map(({ result, content }) => {
    //   console.log(result)
    //   const title =
    //     chalk.bold.red(result.ancestorTitles.join("> \n") + result.title) +
    //     "\n";

    //   return title + "\n";
    // })
    .join("\n");
}

module.exports = JestDotReporter;

/*

  onRunComplete(test, results) {
    const {
      numFailedTests,
      numPassedTests,
      numPendingTests,
      testResults,
      numTotalTests,
      startTime,
    } = results;

    testResults.map(({ failureMessage }) => {
      if (failureMessage) {
        console.log(failureMessage);
      }
    });
    console.log(infoFmt(`Ran ${numTotalTests} tests in ${testDuration()}`));
    if (numPassedTests) {
      console.log(
        this._getStatus("passed") + passedFmt(` ${numPassedTests} passing`)
      );
    }
    if (numFailedTests) {
      console.log(
        this._getStatus("failed") + failedFmt(` ${numFailedTests} failing`)
      );
    }
    if (numPendingTests) {
      console.log(
        this._getStatus("pending") + pendingFmt(` ${numPendingTests} pending`)
      );
    }

    function testDuration() {
      // const delta = moment.duration(moment() - new Date(startTime));
      // const seconds = delta.seconds();
      // const millis = delta.milliseconds();
      // return `${seconds}.${millis} s`;
    }
  }

  _getStatus(status) {
    switch (status) {
      case "passed":
        return passedFmt("✔");
      default:
      case "failed":
        return failedFmt("✘");
      case "pending":
        return pendingFmt("-");
    }
  }

*/
