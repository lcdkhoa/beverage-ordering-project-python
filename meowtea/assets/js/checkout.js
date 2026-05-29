$(document).ready(function () {

  $("#order-note").on("input", function () {
    const length = $(this).val().length;
    $(this)
      .siblings(".note-counter")
      .text(length + "/52 ký tự");
  });


  $("#change-address-btn").on("click", function (e) {
    e.preventDefault();
    $("#delivery-address-input").val($("#delivery-address").val());
    $("#address-edit-block").slideDown(300);
    $("#delivery-address-input").focus();
  });

  $("#btn-cancel-address").on("click", function () {
    $("#address-edit-block").slideUp(300);
  });


  $("#btn-save-address").on("click", function () {
    const val = $("#delivery-address-input").val().trim();
    $("#delivery-address").val(val);
    $("#delivery-address-display").text(val || "Chưa có địa chỉ");
    $("#change-address-btn").text(val ? "Đổi địa chỉ" : "Thêm địa chỉ");
    $("#address-edit-block").slideUp(300);
  });


  const $vatTaxId = $("#vat-tax-id");
  const $vatCompany = $("#vat-company");
  const $vatAddress = $("#vat-address");
  const $vatLookupBtn = $("#vat-lookup-btn");
  let vatLookupLockedTaxId = "";

  function setVatAutofillLocked(isLocked) {
    $vatCompany.prop("disabled", isLocked);
    $vatAddress.prop("disabled", isLocked);
  }

  function resetVatAutofill(clearFields = false) {
    vatLookupLockedTaxId = "";
    setVatAutofillLocked(false);

    if (clearFields) {
      $vatCompany.val("");
      $vatAddress.val("");
    }
  }


  $("#vat-invoice").on("change", function () {
    if ($(this).is(":checked")) {
      $("#vat-fields").slideDown(300);

      $("#vat-fields input").prop("required", true);
    } else {
      $("#vat-fields").slideUp(300);

      $("#vat-fields input").prop("required", false);
    }
  });

  $vatLookupBtn.on("click", function () {
    const taxCode = $vatTaxId.val().replace(/\s+/g, "").trim();
    if (!taxCode) {
      showSnackBar("warm", "Vui lòng nhập mã số thuế");
      $vatTaxId.focus();
      return;
    }

    $vatLookupBtn.prop("disabled", true).text("Đang tra cứu...");

    $.ajax({
      url: getApiPath("order/lookup-tax"),
      method: "GET",
      data: { tax: taxCode },
      dataType: "json",
      success: function (response) {
        if (response.success) {
          $vatCompany.val(response.company_name || "");
          $vatAddress.val(response.company_address || "");
          vatLookupLockedTaxId = taxCode;
          setVatAutofillLocked(true);
          showSnackBar("success", response.message || "Tra cứu mã số thuế thành công");
        } else {
          resetVatAutofill(false);
          showSnackBar("failed", response.message || "Không thể tra cứu mã số thuế");
        }
      },
      error: function (xhr) {
        resetVatAutofill(false);
        const message =
          (xhr.responseJSON && xhr.responseJSON.message) ||
          "Không thể tra cứu mã số thuế. Vui lòng thử lại.";
        showSnackBar("failed", message);
      },
      complete: function () {
        $vatLookupBtn.prop("disabled", false).text("Tra cứu");
      },
    });
  });

  $vatTaxId.on("input", function () {
    const currentTaxCode = $(this).val().replace(/\s+/g, "").trim();
    if (vatLookupLockedTaxId && currentTaxCode !== vatLookupLockedTaxId) {
      resetVatAutofill(true);
    }
  });


  $("#province-select").on("change", function () {
    const selectedProvince = $(this).val();
    const $storeSelect = $("#store-select");


    $storeSelect.val("");
    $("#store-info").slideUp(200);

    if (!selectedProvince) {
      $storeSelect.prop("disabled", true);

      $storeSelect.find("option").show();
      return;
    }


    $storeSelect.prop("disabled", false);
    $storeSelect.find("option").each(function () {
      const value = $(this).attr("value");
      if (!value) {

        $(this).show();
        return;
      }

      const province = $(this).data("province") || "";
      if (province === selectedProvince) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });


  $("#store-select").on("change", function () {
    const selectedOption = $(this).find(":selected");
    const phone = selectedOption.data("phone");
    const address = selectedOption.data("address");

    if (phone || address) {
      $("#store-phone").text(phone || "");
      $("#store-address").text(address || "");
      $("#store-info").slideDown(300);
    } else {
      $("#store-info").slideUp(300);
    }
  });


  let appliedPromotion = null;


  function toggleClearButton() {
    const value = $("#promotion-code").val().trim();
    const $clearBtn = $("#promotion-clear-btn");
    

    if (value) {
      $clearBtn.show();
    } else {
      $clearBtn.hide();
    }
  }


  $("#promotion-code").on("input", function () {
    toggleClearButton();
  });


  $("#promotion-clear-btn").on("click", function () {

    if (appliedPromotion) {
      removePromotionCode();
    } else {

      $("#promotion-code").val("").focus();
      toggleClearButton();
      $("#promotion-message").removeClass("promotion-success promotion-error").text("");
    }
  });


  $("#btn-apply-promotion").on("click", function () {
    applyPromotionCode();
  });


  $("#promotion-code").on("keypress", function (e) {
    if (e.which === 13) {
      e.preventDefault();
      applyPromotionCode();
    }
  });

  function applyPromotionCode() {
    const code = $("#promotion-code").val().trim();
    const $message = $("#promotion-message");
    const $btnApply = $("#btn-apply-promotion");


    $message.removeClass("promotion-success promotion-error").text("");

    if (!code) {
      showSnackBar("failed", "Vui lòng nhập mã khuyến mãi");
      toggleClearButton();
      return;
    }


    $btnApply.prop("disabled", true).text("Đang kiểm tra...");


    const subtotal =
      parseFloat($("#subtotal").text().replace(/[^\d]/g, "")) || 0;


    $.ajax({
      url: getApiPath("promotion/validate"),
      method: "POST",
      data: {
        code: code,
        subtotal: subtotal,
      },
      dataType: "json",
      success: function (response) {
        if (response.success) {

          appliedPromotion = response.promotion;


          $message.addClass("promotion-success").text(response.message);
          $("#promotion-code").prop("disabled", true);
          $btnApply.hide();
          toggleClearButton(); // Show clear button since input has value


          updatePromotionDiscount(response.discount);
          updateTotals();
        } else {
          var msg = response.message || "Mã khuyến mãi không hợp lệ";
          var type = (msg.indexOf("chưa có hiệu lực") !== -1 || msg.indexOf("đã hết hạn") !== -1) ? "warm" : "failed";
          showSnackBar(type, msg);
          $message.removeClass("promotion-success promotion-error").text("");
          appliedPromotion = null;
          updatePromotionDiscount(0);
          updateTotals();
          toggleClearButton();
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra. Vui lòng thử lại.");
        appliedPromotion = null;
        toggleClearButton();
      },
      complete: function () {
        $btnApply.prop("disabled", false).text("Áp dụng");
      },
    });
  }

  function removePromotionCode() {
    const $message = $("#promotion-message");
    const $btnApply = $("#btn-apply-promotion");


    appliedPromotion = null;
    $("#promotion-code").val("").prop("disabled", false).focus();
    $message.removeClass("promotion-success promotion-error").text("");
    $btnApply.show();
    toggleClearButton();


    updatePromotionDiscount(0);
    updateTotals();
  }

  function updatePromotionDiscount(discount) {
    if (discount > 0) {
      $("#promotion-discount").text("-" + formatCurrency(discount));
      $("#promotion-row").slideDown(300);
    } else {
      $("#promotion-discount").text("-0₫");
      $("#promotion-row").slideUp(300);
    }
  }


  function updateTotals() {
    const subtotal =
      parseFloat($("#subtotal").text().replace(/[^\d]/g, "")) || 0;
    const shippingFee =
      parseFloat($("#shipping-fee").text().replace(/[^\d]/g, "")) || 0;
    const promotionDiscount =
      parseFloat($("#promotion-discount").text().replace(/[^\d]/g, "")) || 0;

    const total = subtotal + shippingFee - promotionDiscount;
    $("#total-amount").text(formatCurrency(total));
  }


  $("#pay-now-btn").on("click", function () {

    if (!$("#agree-terms").is(":checked")) {
      showSnackBar("warm", "Vui lòng đồng ý với điều khoản mua hàng");
      return;
    }

    const deliveryAddr = $("#delivery-address").val().trim();
    if (!deliveryAddr) {
      showSnackBar("warm", "Vui lòng nhập địa chỉ giao hàng");
      $("#change-address-btn").trigger("click");
      return;
    }

    const province = $("#province-select").val();
    if (!province) {
      showSnackBar("warm", "Vui lòng chọn Tỉnh/Thành phố");
      return;
    }

    const storeId = $("#store-select").val();
    if (!storeId) {
      showSnackBar("warm", "Vui lòng chọn cửa hàng");
      return;
    }

    const paymentMethod = $("input[name='payment_method']:checked").val();
    if (!paymentMethod) {
      showSnackBar("warm", "Vui lòng chọn phương thức thanh toán");
      return;
    }


    if ($("#vat-invoice").is(":checked")) {
      const vatEmail = $("input[name='vat_email']").val();
      const vatTaxId = $("input[name='vat_tax_id']").val();
      const vatCompany = $("input[name='vat_company']").val();
      const vatAddress = $("input[name='vat_address']").val();

      if (!vatEmail || !vatTaxId || !vatCompany || !vatAddress) {
        showSnackBar("warm", "Vui lòng điền đầy đủ thông tin hóa đơn VAT");
        return;
      }
    }


    $(this).prop("disabled", true).text("Đang xử lý...");


    const orderData = {
      store_id: storeId,
      payment_method: paymentMethod,
      delivery_address: $("#delivery-address").val().trim(),
      order_note: $("#order-note").val(),
      vat_invoice: $("#vat-invoice").is(":checked") ? 1 : 0,
      vat_email: $("input[name='vat_email']").val() || "",
      vat_tax_id: $("input[name='vat_tax_id']").val() || "",
      vat_company: $("input[name='vat_company']").val() || "",
      vat_address: $("input[name='vat_address']").val() || "",
      promotion_code: appliedPromotion ? appliedPromotion.code : "",
      promotion_id: appliedPromotion ? appliedPromotion.id : null,
      promotion_discount: appliedPromotion
        ? appliedPromotion.discount_amount
        : 0,
    };


    $.ajax({
      url: getApiPath("order/create"),
      method: "POST",
      data: orderData,
      dataType: "json",
      success: function (response) {
        if (response.success) {

          const orderResultUrl = "/order-result?order_id=" + response.order_id;
          window.AppLoading ? window.AppLoading.go(orderResultUrl) : (window.location.href = orderResultUrl);
        } else {
          showSnackBar("failed", "Có lỗi xảy ra: " + (response.message || "Vui lòng thử lại"));
          $("#pay-now-btn").prop("disabled", false).text("Thanh toán ngay");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra. Vui lòng thử lại.");
        $("#pay-now-btn").prop("disabled", false).text("Thanh toán ngay");
      },
    });
  });


  updateTotals();
  toggleClearButton();
});
