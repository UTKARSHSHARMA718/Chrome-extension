// constants ------------------------------------------------------------------------------------
const API_KEY = "Your API key";
const API_URL = "https://api.openai.com/v1/chat/completions";
const DEAFULT_ERROR_MESSAGE = "Something went wrong, Please try again!";
const MAX_FONT_SIZE = 20;
const MIN_FONT_SIZE = 8;
const POINTS = "points";
const POINTS_COMMAND =
  "please generate 5 very short points within 20 words addressing major points in the provided text.";
const SUMMARY = "summary";
const SUMMARY_COMMAND =
  "please generate a summary out of given text within 100 word.";
const DELAY = 15;

// errors constants  ------------------------------------------------------------------------------------
const INVALID_REQUEST_ERROR = "invalid_request_error";
const INSUFFICIENT_QUOTA = "insufficient_quota";

//util functions ------------------------------------------------------------------------------------

const getElement = (elementClassName) => {
  return document.querySelector(`.${elementClassName}`);
};

const removeHeader = () => {
  getElement("headerContainer")?.remove();
};

const createAndRetunrImageElement = (src, className, alt) => {
  const imgElement = document.createElement("img");
  imgElement.className = className;
  imgElement.src = src;
  imgElement.alt = alt;
  return imgElement;
};

const removeElementFromDOM = (elementClassName) => {
  document.querySelector(`.${elementClassName}`)?.remove();
};

const disableBtn = (className) => {
  getElement(className).disabled = true;
};

const disableBothSummaryAndPointBtns = () => {
  disableBtn("summary_btn");
  disableBtn("major_points_btn");
};

const enableBothSummaryAndPointsBtn = () => {
  getElement("summary_btn").disabled = false;
  getElement("major_points_btn").disabled = false;
};

const enableSingleBtn = (className) => {
  getElement(className).disabled = false;
};

const changeCssPropertyValue = (propertyName, className, value) => {
  getElement(className).style[propertyName] = value;
};

const createAndAddElementToDOM = (
  elementName,
  elementClassName,
  parentToBeInserted,
  textContent,
  addAtTheStart
) => {
  if (!elementName) {
    return;
  }
  const element = document.createElement(elementName);
  if (elementClassName) element.className = elementClassName;
  addAtTheStart
    ? getElement(parentToBeInserted).prepend(element)
    : parentToBeInserted
    ? getElement(parentToBeInserted)?.appendChild(element)
    : document.body.appendChild(element);
  if (textContent) {
    element.textContent = textContent;
  }
};

const addContentInStreamingFashion = async (str, className, ind) => {
  if (ind >= str.length) {
    getElement("copy_btn").classList.remove("disabledImg");
    changeCssPropertyValue("pointerEvents", "copy_btn", "auto");
    return;
  }
  await setTimeout(() => {
    let textContent = getElement(className)?.innerText;
    textContent +=
      str.charAt(ind) === " " ? str.substring(ind, ind + 2) : str.charAt(ind);
    getElement(className).innerText = textContent;
    let emptyStringOccursOrNot = str.charAt(ind) === " " ? 1 : 0;
    addContentInStreamingFashion(
      str,
      className,
      ind + 1 + emptyStringOccursOrNot
    );
  }, DELAY);
};

const addMajorPointsTotheUl = async (pointsArray, unOrderedListTag) => {
  for (const point of pointsArray) {
    const listTag = document.createElement("li");
    listTag.className = "major_points";
    unOrderedListTag.appendChild(listTag);
    let ind = 0;
    await new Promise((resolve) => {
      const streamedInput = () => {
        if (ind < point.length) {
          listTag.innerHTML += point.charAt(ind);
          ind++;
          setTimeout(streamedInput, DELAY);
        } else {
          resolve();
        }
      };
      streamedInput();
    });
  }
  getElement("copy_btn").classList.remove("disabledImg");
  changeCssPropertyValue("pointerEvents", "copy_btn", "auto");
};

const clearContentSection = () => {
  getElement("summaryOrPoints")?.classList.remove("summaryContainer");
  getElement("summaryOrPoints")?.classList.remove("breifPointsContainer");
  getElement("contentContainer")?.classList.remove("gap10");
  removeContentAndError("breifPoints");
  removeContentAndError("summaryContent");
  removeHeader();
  changeCssPropertyValue("display", "heading", "none");
  changeCssPropertyValue("display", "logoContainer", "none");
};

const showMessageToUserAboutActionPerformed = (messageToShow) => {
  createAndAddElementToDOM("div", "alert_container");
  createAndAddElementToDOM("div", "alert_message_container", "alert_container");
  createAndAddElementToDOM(
    "p",
    "alert_message",
    "alert_message_container",
    messageToShow
  );
  setTimeout(() => {
    removeElementFromDOM("alert_container");
    getElement("copy_btn").classList.remove("disabledImg");
    changeCssPropertyValue("pointerEvents", "copy_btn", "auto");
  }, 2000);
};

const convertStringIntoArrayOfString = (pointsArr, separator) => {
  return pointsArr
    .split(separator)
    .map((point) => {
      let str = point.trim();
      return str.replace(/-/g, "");
    })
    .filter((point) => point.length > 0);
};

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

const getResponse = async (text, commandType) => {
  disableBothSummaryAndPointBtns();
  removeElementFromDOM("headerContainer");
  const data = JSON.stringify({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: `${text}, ${
          commandType === "summary" ? SUMMARY_COMMAND : POINTS_COMMAND
        }`,
      },
    ],
    temperature: 0.5,
  });
  showLoading();
  await fetch(API_URL, {
    method: "POST",
    body: data,
    headers: headers,
  })
    .then((response) => response.json())
    .then((result) => {
      removeElementFromDOM("loading");
      getElement("contentContainer")?.classList.remove("gap10");
      getElement("summaryOrPoints")?.classList.remove("padding10");
      if (
        result?.error?.type &&
        [INVALID_REQUEST_ERROR, INSUFFICIENT_QUOTA].includes(
          result?.error?.type
        )
      ) {
        showErrorInSummaryOrPointContainer();
        return;
      }

      if (commandType === "summary") {
        const para = document.createElement("p");
        para.className = "summaryContent";
        getElement("summaryOrPoints").appendChild(para);
        getElement("summaryOrPoints")?.classList.add("summaryContainer");
        getElement("summaryOrPoints")?.classList.add("padding10");
        headerIconsHandler();

        para.textContent = "";
        const stringForStreamingEffect =
          result?.choices[0]?.message?.content?.trim();
        getElement("copy_btn")?.classList?.add("disabledImg");
        changeCssPropertyValue("pointerEvents", "copy_btn", "none");
        addContentInStreamingFashion(
          stringForStreamingEffect,
          "summaryContent",
          0
        );
        return;
      }
      const unOrderedListTag = document.createElement("ul");
      unOrderedListTag.className = "breifPoints";
      getElement("summaryOrPoints").appendChild(unOrderedListTag);
      const str = result?.choices[0]?.message?.content;

      const pointsToShow = convertStringIntoArrayOfString(str, "\n");
      headerIconsHandler();
      getElement("copy_btn").classList.add("disabledImg");
      changeCssPropertyValue("pointerEvents", "copy_btn", "none");
      getElement("summaryOrPoints")?.classList.add("breifPointsContainer");
      addMajorPointsTotheUl(pointsToShow, unOrderedListTag);
    })
    .catch((error) => {
      removeElementFromDOM("loading");
      getElement("contentContainer")?.classList?.remove("gap10");
      console.log("Error:", error);
      showErrorInSummaryOrPointContainer();
    });
  enableBothSummaryAndPointsBtn();
};

async function getDetails() {
  try {
    return document.all[0].innerText;
  } catch (err) {
    console.log(err);
  }
}

const getData = async (type) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: getDetails,
    },
    async (textData) => {
      const selectedText = getElement(
        "textProvidedByUserForCreatingSummaryOrPoints"
      ).value.trim();
      if (!textData && !selectedText) {
        showErrorInSummaryOrPointContainer();
        return;
      }
      const entireText = !textData ? "" : textData[0]?.result;
      getResponse(selectedText ? selectedText : entireText, type);
    }
  );
};

const removeContentAndError = (contentToRemove) => {
  removeElementFromDOM("summaryOrPointsError");
  removeElementFromDOM(contentToRemove);
};

const addContentHeading = (headingText, parentElementClass) => {
  createAndAddElementToDOM(
    "h3",
    "heading",
    parentElementClass,
    headingText,
    true
  );
};

// html elements ------------------------------------------------------------------------------------
const headerIconsHandler = () => {
  const headerContainer = document.createElement("div");
  headerContainer.className = "headerContainer";
  const leftSideInnerContainer = document.createElement("div");
  leftSideInnerContainer.className = "leftSideInnerContainer";
  const rightSideInnerContainer = document.createElement("div");
  rightSideInnerContainer.className = "rightSideInnerContainer";
  const zoomInZoomOutContainer = document.createElement("div");
  zoomInZoomOutContainer.className = "zoomInZoomOutContainer";

  const copyIcon = createAndRetunrImageElement(
    "./images/copy.svg",
    "copy_btn",
    "copy icon"
  );
  const zoomInIcon = createAndRetunrImageElement(
    "./images/plus.png",
    "zoom_in",
    "zoom in icon"
  );
  const zoomOutIcon = createAndRetunrImageElement(
    "./images/minus.png",
    "zoom_out",
    "zoom out icon"
  );
  const crossIcon = createAndRetunrImageElement(
    "./images/close.png",
    "cross_btn",
    "cross icon"
  );

  getElement("summaryOrPoints")?.prepend(headerContainer);
  headerContainer?.appendChild(leftSideInnerContainer);
  headerContainer?.appendChild(rightSideInnerContainer);
  leftSideInnerContainer?.appendChild(copyIcon);
  leftSideInnerContainer?.appendChild(zoomInZoomOutContainer);
  zoomInZoomOutContainer?.appendChild(zoomOutIcon);
  zoomInZoomOutContainer?.appendChild(zoomInIcon);
  rightSideInnerContainer?.appendChild(crossIcon);

  zoomInEventHandler();
  zoomOutEventHandler();
  removeContentEventHandler();
  copyEventHandler();
};

const showErrorInSummaryOrPointContainer = () => {
  const errorShowingElement = document.createElement("h3");
  errorShowingElement.className = "summaryOrPointsError error";
  errorShowingElement.textContent = DEAFULT_ERROR_MESSAGE;
  getElement("summaryOrPoints")?.appendChild(errorShowingElement);
  getElement("contentContainer")?.classList.add("gap10");
  getElement("summaryOrPoints")?.classList.add("padding10");
  getElement("summaryOrPoints")?.classList.add("summaryContainer");
};

const showLoading = () => {
  const loading = document.createElement("h3");
  loading.className = "loading";
  loading.textContent = "Generating your text...";
  getElement("contentContainer")?.classList.add("gap10");
  getElement("summaryOrPoints")?.classList.add("padding10");
  getElement("summaryOrPoints")?.appendChild(loading);
};

//eventHandlers ------------------------------------------------------------------------------------
const zoomInEventHandler = () => {
  getElement("zoom_in")?.addEventListener("click", () => {
    const elementContainingTextContent =
      document.getElementById("summaryOrPoints");
    let fontSize = parseInt(
      window
        .getComputedStyle(elementContainingTextContent)
        .getPropertyValue("font-size")
    );
    fontSize = fontSize + 1 > MAX_FONT_SIZE ? fontSize : fontSize + 1;
    elementContainingTextContent.style.fontSize = `${fontSize}px`;
    if (fontSize === MAX_FONT_SIZE) {
      getElement("zoom_in").classList.add("disabledImg");
      return;
    }
    getElement("zoom_in").classList.remove("disabledImg");
    if (fontSize > MIN_FONT_SIZE) {
      getElement("zoom_out").classList.remove("disabledImg");
    }
  });
};

const zoomOutEventHandler = () => {
  getElement("zoom_out")?.addEventListener("click", () => {
    const elementContainingTextContent =
      document.getElementById("summaryOrPoints");
    let fontSize = parseInt(
      window
        .getComputedStyle(elementContainingTextContent)
        .getPropertyValue("font-size")
    );
    fontSize = fontSize - 1 < MIN_FONT_SIZE ? fontSize : fontSize - 1;
    elementContainingTextContent.style.fontSize = `${fontSize}px`;
    if (fontSize === MIN_FONT_SIZE) {
      getElement("zoom_out").classList.add("disabledImg");
      return;
    }
    getElement("zoom_out").classList.remove("disabledImg");
    if (fontSize < MAX_FONT_SIZE) {
      getElement("zoom_in").classList.remove("disabledImg");
    }
  });
};

const copyEventHandler = () => {
  getElement("copy_btn")?.addEventListener("click", async () => {
    if (getElement("summaryContent")) {
      try {
        const para = document.querySelector("p");
        await navigator.clipboard.writeText(para?.innerText);
        showMessageToUserAboutActionPerformed(
          "Text is copied to the clipboard!"
        );
      } catch (err) {
        console.log(err);
      }
      getElement("copy_btn").classList.add("disabledImg");
      changeCssPropertyValue("pointerEvents", "copy_btn", "none");
      return;
    }

    try {
      const allPoints = getElement("breifPoints")?.querySelectorAll("li");
      let textToCopy = "";
      allPoints.forEach((points) => {
        textToCopy += points?.innerText;
      });
      await navigator.clipboard.writeText(textToCopy);
      showMessageToUserAboutActionPerformed("Text is copied to the clipboard!");
    } catch (err) {
      console.log(err);
    }
    getElement("copy_btn").classList.add("disabledImg");
    changeCssPropertyValue("pointerEvents", "copy_btn", "none");
  });
};

const removeContentEventHandler = () => {
  getElement("cross_btn").addEventListener("click", () => {
    removeHeader();
    removeElementFromDOM("summaryContent");
    removeElementFromDOM("breifPoints");
    getElement("summaryOrPoints").classList.remove("breifPointsContainer");
    getElement("summaryOrPoints").classList.remove("summaryContainer");
    changeCssPropertyValue("display", "heading", "block");
    changeCssPropertyValue("display", "logoContainer", "block");
  });
};

getElement("summary_btn").addEventListener("click", () => {
  clearContentSection();
  getData(SUMMARY);
});

getElement("major_points_btn").addEventListener("click", () => {
  clearContentSection();
  getData(POINTS);
});

getElement("textProvidedByUserForCreatingSummaryOrPoints").addEventListener(
  "input",
  () => {
    const selectedText = getElement(
      "textProvidedByUserForCreatingSummaryOrPoints"
    ).value.trim();
    const numberOfWords = convertStringIntoArrayOfString(
      selectedText,
      " "
    ).length;
    if (numberOfWords > 0 && numberOfWords < 10) {
      disableBothSummaryAndPointBtns();
      return;
    }
    enableBothSummaryAndPointsBtn();
  }
);

getElement("clear_btn").addEventListener("click", () => {
  getElement("textProvidedByUserForCreatingSummaryOrPoints").value = "";
  enableBothSummaryAndPointsBtn();
});
