$(document).ready(function () {
  const apiBasePath = getApiBasePath();

  function startTopLoading() {
    return window.AppLoading ? window.AppLoading.start() : function () {};
  }

  function renderInlineLoading($target, message, modifierClass) {
    if (window.AppLoading) {
      window.AppLoading.renderInline($target, message, modifierClass);
    } else {
      $target.html('<div class="loading-spinner">' + escapeHtml(message || "Đang tải...") + "</div>");
    }
  }

  function markContentReady($target) {
    $target.addClass("app-content-swap");
    setTimeout(function () {
      $target.removeClass("app-content-swap");
    }, 220);
  }


  loadPromotions();



  $("#btn-add-promotion").on("click", function () {
    $("#add-promotion-modal").addClass("active");
    $("#add-promotion-form")[0].reset();
    $("#promotion-loai-giam-gia").val("Percentage");
    $("#promotion-trang-thai").val("1");
    toggleMaxValueField();
  });


  function toggleMaxValueField() {
    const loaiGiamGia = $("#promotion-loai-giam-gia").val();
    const editLoaiGiamGia = $("#edit-promotion-loai-giam-gia").val();

    if (loaiGiamGia === "Percentage") {
      $("#promotion-max-value-group").slideDown(300);
    } else {
      $("#promotion-max-value-group").slideUp(300);
      $("#promotion-gia-tri-toi-da").val("");
    }

    if (editLoaiGiamGia === "Percentage") {
      $("#edit-promotion-max-value-group").slideDown(300);
    } else {
      $("#edit-promotion-max-value-group").slideUp(300);
      $("#edit-promotion-gia-tri-toi-da").val("");
    }
  }


  $("#promotion-loai-giam-gia, #edit-promotion-loai-giam-gia").on(
    "change",
    function () {
      toggleMaxValueField();
    }
  );

  $("#close-add-modal, #cancel-add-promotion, .modal-overlay").on(
    "click",
    function (e) {
      if (
        $(e.target).hasClass("modal-overlay") ||
        $(e.target).closest(".modal-close").length ||
        $(e.target).attr("id") === "cancel-add-promotion"
      ) {
        $("#add-promotion-modal").removeClass("active");
      }
    }
  );


  $(document).on("click", ".btn-edit-promotion", function () {
    const promotionId = $(this).data("promotion-id");
    const promotionCode = $(this).data("promotion-code");
    const loaiGiamGia = $(this).data("loai-giam-gia");
    const giaTri = $(this).data("gia-tri");
    const giaTriToiDa = $(this).data("gia-tri-toi-da");
    const ngayBatDau = $(this).data("ngay-bat-dau");
    const ngayKetThuc = $(this).data("ngay-ket-thuc");
    const trangThai = $(this).data("trang-thai");

    $("#edit-promotion-id").val(promotionId);
    $("#edit-promotion-code").val(promotionCode);
    $("#edit-promotion-loai-giam-gia").val(loaiGiamGia || "Percentage");
    $("#edit-promotion-gia-tri").val(giaTri);
    $("#edit-promotion-gia-tri-toi-da").val(giaTriToiDa || "");


    toggleMaxValueField();


    if (ngayBatDau) {
      const startDate = new Date(ngayBatDau);
      const startLocal = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      $("#edit-promotion-ngay-bat-dau").val(startLocal);
    } else {
      $("#edit-promotion-ngay-bat-dau").val("");
    }

    if (ngayKetThuc) {
      const endDate = new Date(ngayKetThuc);
      const endLocal = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16);
      $("#edit-promotion-ngay-ket-thuc").val(endLocal);
    } else {
      $("#edit-promotion-ngay-ket-thuc").val("");
    }

    $("#edit-promotion-trang-thai").val(trangThai);
    $("#edit-promotion-modal").addClass("active");
  });

  $("#close-edit-modal, #cancel-edit-promotion, .modal-overlay").on(
    "click",
    function (e) {
      if (
        $(e.target).hasClass("modal-overlay") ||
        $(e.target).closest(".modal-close").length ||
        $(e.target).attr("id") === "cancel-edit-promotion"
      ) {
        $("#edit-promotion-modal").removeClass("active");
      }
    }
  );


  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      $(".modal").removeClass("active");
    }
  });


  $(document).on("click", ".btn-delete-promotion", function () {
    const promotionId = $(this).data("promotion-id");
    const promotionCode = $(this).data("promotion-code");

    showDeleteConfirmDialog({
      title: "Xóa khuyến mãi",
      message:
        "Bạn có chắc chắn muốn xóa khuyến mãi '" +
        promotionCode +
        "'?\n\nHành động này không thể hoàn tác.",
      onConfirm: function () {
        $.ajax({
          url: apiBasePath + "delete-promotion",
          method: "POST",
          data: {
            promotion_id: promotionId,
          },
          dataType: "json",
          success: function (response) {
            if (response.success) {
              showSnackBar("success", response.message);
              loadPromotions();
            } else {
              showSnackBar("failed", response.message || "Có lỗi xảy ra");
            }
          },
          error: function (xhr, status, error) {
            console.error("Error:", error);
            showSnackBar("failed", "Có lỗi xảy ra khi xóa khuyến mãi. Vui lòng thử lại.");
          },
        });
      },
    });
  });



  $("#add-promotion-form").on("submit", function (e) {
    e.preventDefault();

    const formData = {
      code: $("#promotion-code").val().trim(),
      loai_giam_gia: $("#promotion-loai-giam-gia").val(),
      gia_tri: $("#promotion-gia-tri").val(),
      gia_tri_toi_da: $("#promotion-gia-tri-toi-da").val() || "",
      ngay_bat_dau: $("#promotion-ngay-bat-dau").val() || "",
      ngay_ket_thuc: $("#promotion-ngay-ket-thuc").val() || "",
      trang_thai: $("#promotion-trang-thai").val(),
    };


    if (!formData.code) {
      showSnackBar("failed", "Vui lòng nhập mã khuyến mãi");
      return;
    }

    if (!formData.gia_tri || formData.gia_tri < 0) {
      showSnackBar("failed", "Vui lòng nhập giá trị giảm giá hợp lệ");
      return;
    }

    if (
      formData.loai_giam_gia === "Percentage" &&
      (formData.gia_tri > 100 || formData.gia_tri < 0)
    ) {
      showSnackBar("failed", "Phần trăm giảm giá phải từ 0 đến 100");
      return;
    }


    $.ajax({
      url: apiBasePath + "create-promotion",
      method: "POST",
      data: formData,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          $("#add-promotion-modal").removeClass("active");
          $("#add-promotion-form")[0].reset();
          loadPromotions(); // Reload promotions list
        } else {
          showSnackBar("failed", response.message || "Có lỗi xảy ra");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi thêm khuyến mãi. Vui lòng thử lại.");
      },
    });
  });


  $("#edit-promotion-form").on("submit", function (e) {
    e.preventDefault();

    const formData = {
      promotion_id: $("#edit-promotion-id").val(),
      code: $("#edit-promotion-code").val().trim(),
      loai_giam_gia: $("#edit-promotion-loai-giam-gia").val(),
      gia_tri: $("#edit-promotion-gia-tri").val(),
      gia_tri_toi_da: $("#edit-promotion-gia-tri-toi-da").val() || "",
      ngay_bat_dau: $("#edit-promotion-ngay-bat-dau").val() || "",
      ngay_ket_thuc: $("#edit-promotion-ngay-ket-thuc").val() || "",
      trang_thai: $("#edit-promotion-trang-thai").val(),
    };


    if (!formData.code) {
      showSnackBar("failed", "Vui lòng nhập mã khuyến mãi");
      return;
    }

    if (!formData.gia_tri || formData.gia_tri < 0) {
      showSnackBar("failed", "Vui lòng nhập giá trị giảm giá hợp lệ");
      return;
    }

    if (
      formData.loai_giam_gia === "Percentage" &&
      (formData.gia_tri > 100 || formData.gia_tri < 0)
    ) {
      showSnackBar("failed", "Phần trăm giảm giá phải từ 0 đến 100");
      return;
    }


    $.ajax({
      url: apiBasePath + "update-promotion",
      method: "POST",
      data: formData,
      dataType: "json",
      success: function (response) {
        if (response.success) {
          showSnackBar("success", response.message);
          $("#edit-promotion-modal").removeClass("active");
          loadPromotions(); // Reload promotions list
        } else {
          var msg = response.message || "Có lỗi xảy ra";
          var type = msg.indexOf("Không có thay đổi nào") !== -1 ? "warm" : "failed";
          showSnackBar(type, msg);
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi cập nhật khuyến mãi. Vui lòng thử lại.");
      },
    });
  });


  function loadPromotions() {
    const $wrapper = $("#promotions-table-wrapper");
    renderInlineLoading($wrapper, "Đang tải khuyến mãi...", "app-inline-loader--panel");
    const finishLoading = startTopLoading();

    $.ajax({
      url: apiBasePath + "promotions",
      method: "GET",
      dataType: "json",
      success: function (response) {
        if (response.success) {
          renderPromotions(response.data);
          markContentReady($wrapper);
        } else {
          showSnackBar("failed", response.message || "Không thể tải danh sách khuyến mãi");
          $("#promotions-table-wrapper").html('<div class="empty-state">Không thể tải danh sách khuyến mãi</div>');
        }
      },
      error: function (xhr, status, error) {
        console.error("Error loading promotions:", error);
        showSnackBar("failed", "Có lỗi xảy ra khi tải danh sách khuyến mãi");
        $("#promotions-table-wrapper").html('<div class="empty-state">Không thể tải danh sách khuyến mãi</div>');
      },
      complete: finishLoading,
    });
  }

  function renderPromotions(promotions) {
    const $wrapper = $("#promotions-table-wrapper");

    if (promotions.length === 0) {
      $wrapper.html('<div class="empty-state">Chưa có khuyến mãi nào</div>');
      return;
    }

    let html = '<table class="promotions-table">';
    html += "<thead>";
    html += "<tr>";
    html += "<th>Mã KM</th>";
    html += "<th>Mã khuyến mãi</th>";
    html += "<th>Loại giảm giá</th>";
    html += "<th>Giá trị</th>";
    html += "<th>Ngày bắt đầu</th>";
    html += "<th>Ngày kết thúc</th>";
    html += "<th>Trạng thái</th>";
    html += "<th>Thao tác</th>";
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";

    promotions.forEach(function (promotion) {
      const loaiGiamGia = promotion.LoaiGiamGia || "Percentage";
      const giaTri = parseFloat(promotion.GiaTri);
      const giaTriDisplay =
        loaiGiamGia === "Percentage" ? giaTri + "%" : formatCurrency(giaTri);
      const ngayBatDau = promotion.NgayBatDau
        ? formatDateTime(promotion.NgayBatDau)
        : "-";
      const ngayKetThuc = promotion.NgayKetThuc
        ? formatDateTime(promotion.NgayKetThuc)
        : "-";
      const trangThai = promotion.TrangThai == 1 ? "Kích hoạt" : "Vô hiệu hóa";
      const trangThaiClass =
        promotion.TrangThai == 1 ? "status-active" : "status-inactive";

      html += "<tr>";
      html += "<td>" + promotion.MaPromotion + "</td>";
      html +=
        '<td><div class="promotion-code">' +
        escapeHtml(promotion.Code) +
        "</div></td>";
      html +=
        '<td><div class="promotion-type">' +
        (loaiGiamGia === "Percentage" ? "Phần trăm" : "Số tiền") +
        "</div></td>";
      html +=
        '<td><div class="promotion-value">' + giaTriDisplay + "</div></td>";
      html += '<td><div class="promotion-date">' + ngayBatDau + "</div></td>";
      html += '<td><div class="promotion-date">' + ngayKetThuc + "</div></td>";
      html +=
        '<td><span class="status-badge ' +
        trangThaiClass +
        '">' +
        trangThai +
        "</span></td>";
      html += "<td>";
      html += '<div class="action-buttons">';
      html +=
        '<button type="button" class="btn btn-edit btn-edit-promotion" ' +
        'data-promotion-id="' +
        promotion.MaPromotion +
        '" ' +
        'data-promotion-code="' +
        escapeHtml(promotion.Code) +
        '" ' +
        'data-loai-giam-gia="' +
        escapeHtml(loaiGiamGia) +
        '" ' +
        'data-gia-tri="' +
        promotion.GiaTri +
        '" ' +
        'data-gia-tri-toi-da="' +
        (promotion.GiaTriToiDa || "") +
        '" ' +
        'data-ngay-bat-dau="' +
        (promotion.NgayBatDau || "") +
        '" ' +
        'data-ngay-ket-thuc="' +
        (promotion.NgayKetThuc || "") +
        '" ' +
        'data-trang-thai="' +
        promotion.TrangThai +
        '">';
      html +=
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
      html +=
        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>';
      html +=
        '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>';
      html += "</svg>";
      html += " Sửa";
      html += "</button>";
      html +=
        '<button type="button" class="btn btn-delete btn-delete-promotion" ' +
        'data-promotion-id="' +
        promotion.MaPromotion +
        '" ' +
        'data-promotion-code="' +
        escapeHtml(promotion.Code) +
        '">';
      html +=
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
      html += '<polyline points="3 6 5 6 21 6"/>';
      html +=
        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>';
      html += "</svg>";
      html += " Xóa";
      html += "</button>";
      html += "</div>";
      html += "</td>";
      html += "</tr>";
    });

    html += "</tbody>";
    html += "</table>";

    $wrapper.html(html);
  }



  function formatCurrency(amount) {
    return formatCurrencyWithStyle(amount);
  }

  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "-";
    const date = new Date(dateTimeString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
});
