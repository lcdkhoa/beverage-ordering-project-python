$(document).ready(function () {

  let isDeleting = false;


  function updateTotalAmount() {
    let total = 0;
    $(".cart-item").each(function () {
      const $item = $(this);
      const $checkbox = $item.find(".item-checkbox");
      if ($checkbox.is(":checked")) {
        const totalText = $item.find(".total-value").text();
        const totalValue = parseFloat(totalText.replace(/[^\d]/g, ""));
        if (!isNaN(totalValue)) {
          total += totalValue;
        }
      }
    });

    $("#cart-total-amount").text(formatCurrency(total));
  }


  function updateQuantity(itemIndex, newQuantity) {

    if (isDeleting) {
      return;
    }


    const $item = $(".cart-item[data-item-index='" + itemIndex + "']");
    if ($item.length === 0) {
      return;
    }

    $.ajax({
      url: getApiPath("cart/update"),
      method: "POST",
      data: {
        item_index: itemIndex,
        quantity: newQuantity,
      },
      dataType: "json",
      success: function (response) {
        if (response.success) {

          location.reload();
        } else {
          showSnackBar('failed', "Có lỗi xảy ra: " + (response.message || "Vui lòng thử lại"));
        }
      },
      error: function () {
        showSnackBar('failed', "Có lỗi xảy ra. Vui lòng thử lại.");
      },
    });
  }


  function deleteItem(itemIndex) {

    if (isDeleting) {
      return;
    }


    const $item = $(".cart-item[data-item-index='" + itemIndex + "']");
    if ($item.length === 0) {
      showSnackBar('failed', 'Sản phẩm không tồn tại trong giỏ hàng');
      return;
    }


    showDeleteConfirmDialog({
      title: 'Xóa sản phẩm',
      message: 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?',
      onConfirm: function() {
        proceedWithDeletion(itemIndex);
      }
    });
  }


  function proceedWithDeletion(itemIndex) {

    isDeleting = true;
    $(".delete-btn").prop("disabled", true);

    $.ajax({
      url: getApiPath("cart/delete"),
      method: "POST",
      data: {
        item_index: itemIndex,
      },
      dataType: "json",
      success: function (response) {
        if (response.success) {

          location.reload();
        } else {
          showSnackBar('failed', 'Có lỗi xảy ra: ' + (response.message || "Vui lòng thử lại"));
          isDeleting = false;
          $(".delete-btn").prop("disabled", false);
        }
      },
      error: function () {
        showSnackBar('failed', 'Có lỗi xảy ra. Vui lòng thử lại.');
        isDeleting = false;
        $(".delete-btn").prop("disabled", false);
      },
    });
  }


  function updateNote(itemIndex, note) {

    if (isDeleting) {
      return;
    }


    const $item = $(".cart-item[data-item-index='" + itemIndex + "']");
    if ($item.length === 0) {
      return;
    }

    $.ajax({
      url: getApiPath("cart/update"),
      method: "POST",
      data: {
        item_index: itemIndex,
        note: note,
      },
      dataType: "json",
      success: function (response) {
        if (!response.success) {
          console.error("Error updating note:", response.message);
        }
      },
      error: function () {
        console.error("Error updating note");
      },
    });
  }


  $("#select-all-items").on("change", function () {
    const isChecked = $(this).is(":checked");
    $(".item-checkbox").prop("checked", isChecked);
    updateTotalAmount();
  });


  $(document).on("change", ".item-checkbox", function () {
    updateTotalAmount();


    const totalItems = $(".item-checkbox").length;
    const checkedItems = $(".item-checkbox:checked").length;
    $("#select-all-items").prop("checked", totalItems === checkedItems);
  });


  $(document).on("click", ".minus-btn", function () {
    const itemIndex = $(this).data("item-index");
    const $input = $(this).siblings(".quantity-input");
    let quantity = parseInt($input.val()) || 1;

    if (quantity > 1) {
      quantity--;
      updateQuantity(itemIndex, quantity);
    }
  });

  $(document).on("click", ".plus-btn", function () {
    const itemIndex = $(this).data("item-index");
    const $input = $(this).siblings(".quantity-input");
    let quantity = parseInt($input.val()) || 1;
    quantity++;
    updateQuantity(itemIndex, quantity);
  });


  $(document).on("change", ".quantity-input", function () {
    const itemIndex = $(this).data("item-index");
    let quantity = parseInt($(this).val()) || 1;

    if (quantity < 1) {
      quantity = 1;
      $(this).val(1);
    }

    updateQuantity(itemIndex, quantity);
  });


  $(document).on("click", ".delete-btn", function () {
    const itemIndex = $(this).data("item-index");
    deleteItem(itemIndex);
  });


  let noteUpdateTimeout;
  $(document).on("input", ".note-input", function () {
    const $input = $(this);
    const itemIndex = $input.data("item-index");
    const note = $input.val();
    const noteLength = note.length;


    $input.siblings(".note-counter").text(noteLength + "/52 ký tự");


    clearTimeout(noteUpdateTimeout);
    noteUpdateTimeout = setTimeout(function () {
      updateNote(itemIndex, note);
    }, 500);
  });


  $("#checkout-btn").on("click", function () {
    const checkedItems = $(".item-checkbox:checked");

    if (checkedItems.length === 0) {
      
        showSnackBar('warm', "Vui lòng chọn ít nhất một sản phẩm để đặt hàng");
      
    }


    const selectedIndices = [];
    checkedItems.each(function () {
      selectedIndices.push($(this).data("item-index"));
    });




    window.location.href = "/checkout";
  });


  updateTotalAmount();
});
