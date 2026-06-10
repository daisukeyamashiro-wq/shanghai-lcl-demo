(function () {
  "use strict";

  const MAIL_TO = "contact@example.com";
  const MAIL_SUBJECT = "上海発LCL正式見積依頼";

  const japanSideCostConfig = {
    general: {
      minPerRt: 15000,
      maxPerRt: 25000,
      inquiryThresholdRt: 10,
      note: "上記は日本側ローカル費用の目安です。日本国内配送費、通関費用、税金、検査費用、特殊作業費は含みません。正式見積で確認します。",
    },
    individual: {
      compact: "個別確認\n※海上運賃別途",
      detail: "個別確認（海上運賃別途）",
      note: "貨物条件・必要書類・船社/CFS受入可否・梱包状態により日本側費用が変動します。海上運賃は別途正式見積となります。",
    },
  };

  const destinationConfig = {
    tokyo: {
      label: "東京",
      notes: [
        "貨物内容・HS CODE・用途の確認",
        "INVOICE / PACKING LISTの確認",
        "CFS搬入・デバン予定・フリータイムの確認",
        "日本側配送有無の確認",
        "特殊貨物の場合は追加書類・船社/CFS受入可否の確認",
      ],
    },
    nagoya: {
      label: "名古屋",
      notes: [
        "貨物内容・HS CODE・用途の確認",
        "INVOICE / PACKING LISTの確認",
        "CFS搬入・デバン予定・フリータイムの確認",
        "日本側配送有無の確認",
        "特殊貨物の場合は追加書類・船社/CFS受入可否の確認",
      ],
    },
    osaka: {
      label: "大阪",
      notes: [
        "貨物内容・HS CODE・用途の確認",
        "INVOICE / PACKING LISTの確認",
        "CFS搬入・デバン予定・フリータイムの確認",
        "日本側配送有無の確認",
        "特殊貨物の場合は追加書類・船社/CFS受入可否の確認",
      ],
    },
  };

  const conditionConfig = {
    general: {
      label: "一般貨物",
      level: "normal",
      message: "正式には、貨物内容・HS CODE・梱包状態・船社/CFS受入条件の確認が必要です。",
    },
    battery: {
      label: "電池あり",
      level: "warning",
      message: "事前確認必要：MSDS、UN38.3、製品写真、電池容量情報の確認が必要です。",
    },
    liquid: {
      label: "液体あり",
      level: "warning",
      message: "事前確認必要：成分表、SDS、液漏れ対策、危険品該当有無の確認が必要です。",
    },
    magnet: {
      label: "磁石あり",
      level: "warning",
      message: "事前確認必要：磁力、梱包状態、船社・CFS受入可否の確認が必要です。",
    },
    food: {
      label: "食品あり",
      level: "warning",
      message: "事前確認必要：日本側輸入規制、食品届、成分、用途確認が必要です。",
    },
    dangerous: {
      label: "危険品の可能性あり",
      level: "danger",
      message: "SDS確認後、危険品LCLまたは別手配を検討します。",
    },
    long: {
      label: "長尺貨物",
      level: "warning",
      message: "CFS受入確認必要：サイズ・梱包状態により追加費用または受入不可の可能性があります。",
    },
    heavy: {
      label: "重量物",
      level: "warning",
      message: "CFS・ドレー制約確認必要：重量により作業費・受入可否・車両条件が変わる可能性があります。",
    },
  };

  const requiredInfo = [
    "貨物内容",
    "HS CODE",
    "INVOICE",
    "PACKING LIST",
    "サイズ明細",
    "G/W",
    "電池・危険品・液体・食品などの有無",
    "製品写真",
    "希望納期",
    "日本側配送有無",
  ];

  const cautions = [
    "本ツールは初期診断であり、輸送可否・費用・納期を確定するものではありません。",
    "表示金額は日本側ローカル費用の目安であり、海上運賃・中国側費用・通関費用・税金・日本国内配送費は含みません。",
    "正式見積には貨物内容、HS CODE、INVOICE、PACKING LIST、サイズ、重量、梱包状態、危険品・電池有無の確認が必要です。",
    "通常LCLでの受託可否は、船社・CFS・通関条件・貨物内容・梱包状態により変わります。",
    "危険品、電池、液体、食品、長尺貨物、重量物は個別確認となります。",
  ];

  const form = document.querySelector("#lcl-template-form");
  const cbmInput = document.querySelector("#lcl-template-cbm");
  const weightInput = document.querySelector("#lcl-template-weight");
  const destinationInput = document.querySelector("#lcl-template-destination");
  const cargoRiskInputs = Array.from(document.querySelectorAll('input[name="cargoRiskCondition"]'));
  const packingInputs = Array.from(document.querySelectorAll('input[name="packingCondition"]'));
  const remarksInput = document.querySelector("#lcl-template-remarks");
  const errorBox = document.querySelector("#lcl-template-error");
  const resultCard = document.querySelector("#lcl-template-result");
  const emptyState = document.querySelector("#lcl-template-empty");
  const resultBody = document.querySelector("#lcl-template-result-body");
  const mailButton = document.querySelector("#lcl-template-mail-button");

  const resultNodes = {
    destination: document.querySelector("#lcl-template-result-destination"),
    cbm: document.querySelector("#lcl-template-result-cbm"),
    weight: document.querySelector("#lcl-template-result-weight"),
    rt: document.querySelector("#lcl-template-result-rt"),
    riskLevel: document.querySelector("#lcl-template-risk-level"),
    diagnosisStatus: document.querySelector("#lcl-template-diagnosis-status"),
    diagnosisList: document.querySelector("#lcl-template-diagnosis-list"),
    destinationNote: document.querySelector("#lcl-template-destination-note"),
    requiredList: document.querySelector("#lcl-template-required-list"),
    cautionList: document.querySelector("#lcl-template-caution-list"),
    japanCost: document.querySelector("#lcl-template-japan-cost"),
    japanCostMain: document.querySelector("#lcl-template-japan-cost-main"),
    japanCostNote: document.querySelector("#lcl-template-japan-cost-note"),
  };

  const packingConfig = {
    carton: "段ボール",
    wooden: "木箱・木枠",
    pallet: "パレット積み",
    plastic: "プラスチックケース・カートン",
    loose: "バラ積み",
    other: "その他",
  };

  function formatNumber(value, maximumDigits) {
    return new Intl.NumberFormat("ja-JP", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maximumDigits,
    }).format(value);
  }

  function formatWeight(value) {
    return new Intl.NumberFormat("ja-JP", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  function formatYenRange(minValue, maxValue) {
    return `${formatNumber(Math.round(minValue), 0)}〜${formatNumber(Math.round(maxValue), 0)}円`;
  }

  function getSelectedCargoRisks() {
    return cargoRiskInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function getSelectedPackingConditions() {
    return packingInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.textContent = "";
    errorBox.hidden = true;
  }

  // 一般貨物と特殊条件が同時に残らないよう、貨物リスク条件だけを整理します。
  function handleCargoRiskChange(event) {
    const changedInput = event.target;
    const generalInput = cargoRiskInputs.find((input) => input.value === "general");
    const specialInputs = cargoRiskInputs.filter((input) => input.value !== "general");

    if (changedInput.value === "general" && changedInput.checked) {
      specialInputs.forEach((input) => {
        input.checked = false;
      });
      return;
    }

    if (changedInput.value !== "general" && changedInput.checked && generalInput) {
      generalInput.checked = false;
    }
  }

  function validateInputs(cbm, weight, destination, cargoRisks) {
    if (!Number.isFinite(cbm) || cbm <= 0) {
      return "CBMを0より大きい数値で入力してください。";
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      return "G/W KGSを0より大きい数値で入力してください。";
    }

    if (!destinationConfig[destination]) {
      return "仕向地を選択してください。";
    }

    if (cargoRisks.length === 0) {
      return "貨物リスク条件を1つ以上選択してください。";
    }

    return "";
  }

  function getDiagnosisLevel(cargoRisks, weight) {
    if (cargoRisks.includes("dangerous")) {
      return "danger";
    }

    if (cargoRisks.some((condition) => condition !== "general") || weight >= 1000) {
      return "warning";
    }

    return "normal";
  }

  // 一般貨物のみ、課金RT目安に応じて日本側ローカル費用の目安を出します。
  function getJapanSideCost(isIndividualCost, chargeableRt) {
    if (isIndividualCost) {
      return japanSideCostConfig.individual;
    }

    const config = japanSideCostConfig.general;

    if (chargeableRt >= config.inquiryThresholdRt) {
      return {
        compact: "要お問い合わせ\n※10CBM以上または課金RT10以上\n※海上運賃別途",
        detail: "要お問い合わせ（10CBM以上または課金RT10以上／海上運賃別途）",
        note: "10CBM以上または課金RT10以上の貨物は、CFS条件・作業条件・搬入形態により日本側ローカル費用が変動します。正式見積で確認します。",
      };
    }

    const minCost = config.minPerRt * chargeableRt;
    const maxCost = config.maxPerRt * chargeableRt;
    const range = `${formatYenRange(minCost, maxCost)}程度`;

    return {
      compact: `${range}\n※一般貨物・1BL・小口LCL・日本国内配送なしの場合\n※海上運賃別途`,
      detail: `${range}（一般貨物・1BL・小口LCL・日本国内配送なしの場合／海上運賃別途）`,
      note: config.note,
    };
  }

  function getStatusSummary(level, isIndividualCost, japanSideCost) {
    if (level === "danger") {
      return {
        riskLevel: "🔴 個別確認",
        japanCost: japanSideCost.compact,
        diagnosisStatus: "通常LCL不可の可能性あり",
      };
    }

    if (level === "warning" || isIndividualCost) {
      return {
        riskLevel: "🟡 追加確認必要",
        japanCost: japanSideCost.compact,
        diagnosisStatus: "事前確認必要",
      };
    }

    return {
      riskLevel: "🟢 一般貨物",
      japanCost: japanSideCost.compact,
      diagnosisStatus: "通常LCLで手配可能性あり",
    };
  }

  function buildDiagnosisMessages(cargoRisks, weight, level) {
    const messages = [];

    if (level === "danger") {
      messages.push("SDS確認後、危険品LCLまたは別手配を検討します。");
    } else if (level === "warning") {
      messages.push("貨物条件・必要書類・船社/CFS受入可否を確認後、正式見積します。");
    } else {
      messages.push(conditionConfig.general.message);
    }

    cargoRisks.forEach((condition) => {
      if (condition === "general" || condition === "dangerous") {
        return;
      }
      messages.push(conditionConfig[condition].message);
    });

    if (cargoRisks.includes("dangerous")) {
      messages.push("通常LCLでは受けられない可能性があります。");
    }

    if (weight >= 1000 && !cargoRisks.includes("heavy")) {
      messages.push("重量が1,000KGS以上のため、CFS作業費・受入可否・日本側ドレー条件の確認が必要です。");
    }

    return messages;
  }

  function renderList(target, items) {
    target.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  }

  function buildMailBody(result) {
    return [
      "〇〇株式会社 御中",
      "",
      "上海発LCLの正式見積を依頼します。",
      "",
      "【入力内容】",
      `仕向地：${result.destinationLabel}`,
      `入力CBM：${formatNumber(result.cbm, 2)} CBM`,
      `入力重量：${formatWeight(result.weight)} KGS`,
      `課金RT目安：${formatNumber(result.chargeableRt, 2)} RT`,
      `貨物リスク条件：${result.cargoRiskLabels.join("、")}`,
      `梱包状態：${result.packingLabels.length > 0 ? result.packingLabels.join("、") : "未選択"}`,
      `備考：${result.remarks || "未記入"}`,
      `日本側費用目安：${result.japanSideCost.detail}`,
      "海上運賃：別途正式見積",
      "",
      "【初期診断結果】",
      ...result.diagnosisMessages.map((message) => `・${message}`),
      "",
      "【仕向地別確認ポイント】",
      ...result.destinationNotes.map((note) => `・${note}`),
      "",
      "【追加記入欄】",
      "貨物内容：",
      "HS CODE：",
      "INVOICE / PACKING LIST：",
      "サイズ明細：",
      "製品写真：",
      "希望納期：",
      "日本側配送有無：",
      "",
      "以上、よろしくお願いいたします。",
    ].join("\n");
  }

  function updateResultClass(level) {
    resultCard.classList.remove("lcl-template-result-neutral", "lcl-template-result-normal", "lcl-template-result-warning", "lcl-template-result-danger");
    resultCard.classList.add(`lcl-template-result-${level}`);
  }

  function renderResult(result) {
    emptyState.hidden = true;
    emptyState.classList.add("is-hidden");
    resultBody.hidden = false;

    updateResultClass(result.level);
    resultNodes.riskLevel.textContent = result.statusSummary.riskLevel;
    resultNodes.diagnosisStatus.textContent = result.statusSummary.diagnosisStatus;
    resultNodes.destination.textContent = result.destinationLabel;
    resultNodes.cbm.textContent = `${formatNumber(result.cbm, 2)} CBM`;
    resultNodes.weight.textContent = `${formatWeight(result.weight)} KGS`;
    resultNodes.rt.textContent = `${formatNumber(result.chargeableRt, 2)} RT`;
    renderList(resultNodes.destinationNote, result.destinationNotes);
    resultNodes.japanCost.textContent = result.statusSummary.japanCost;
    resultNodes.japanCostMain.textContent = result.japanSideCost.detail;
    resultNodes.japanCostNote.textContent = result.japanSideCost.note;

    renderList(resultNodes.diagnosisList, result.diagnosisMessages);
    renderList(resultNodes.requiredList, requiredInfo);
    renderList(resultNodes.cautionList, cautions);

    const mailBody = buildMailBody(result);
    const mailHref = `mailto:${MAIL_TO}?subject=${encodeURIComponent(MAIL_SUBJECT)}&body=${encodeURIComponent(mailBody)}`;
    mailButton.setAttribute("href", mailHref);
    mailButton.setAttribute("aria-disabled", "false");
  }

  function calculateResult() {
    const cbm = Number.parseFloat(cbmInput.value);
    const weight = Number.parseFloat(weightInput.value);
    const destination = destinationInput.value;
    const cargoRisks = getSelectedCargoRisks();
    const packingConditions = getSelectedPackingConditions();
    const remarks = remarksInput.value.trim();
    const validationMessage = validateInputs(cbm, weight, destination, cargoRisks);

    if (validationMessage) {
      showError(validationMessage);
      return;
    }

    clearError();

    const chargeableRt = Math.max(cbm, weight / 1000, 1);
    const destinationData = destinationConfig[destination];
    const level = getDiagnosisLevel(cargoRisks, weight);
    const diagnosisMessages = buildDiagnosisMessages(cargoRisks, weight, level);
    const cargoRiskLabels = cargoRisks.map((condition) => conditionConfig[condition].label);
    const packingLabels = packingConditions.map((condition) => packingConfig[condition]);
    const hasSpecialCondition = cargoRisks.some((condition) => condition !== "general");
    const isIndividualCost = hasSpecialCondition || weight >= 1000;
    const japanSideCost = getJapanSideCost(isIndividualCost, chargeableRt);
    const statusSummary = getStatusSummary(level, isIndividualCost, japanSideCost);

    renderResult({
      cbm,
      weight,
      chargeableRt,
      destinationLabel: destinationData.label,
      destinationNotes: destinationData.notes,
      cargoRiskLabels,
      packingLabels,
      remarks,
      diagnosisMessages,
      level,
      isIndividualCost,
      statusSummary,
      japanSideCost,
    });
  }

  cargoRiskInputs.forEach((input) => {
    input.addEventListener("change", handleCargoRiskChange);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateResult();
  });
})();
