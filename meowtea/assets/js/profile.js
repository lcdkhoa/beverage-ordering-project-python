$(document).ready(function() {

    $('.collapsible-header').on('click', function() {
        const $header = $(this);
        const targetId = $header.data('target');
        const $content = $('#' + targetId);
        

        $header.toggleClass('collapsed');
        $content.toggleClass('collapsed');
        

        const isExpanded = !$header.hasClass('collapsed');
        $header.attr('aria-expanded', isExpanded);
    });


    $('.profile-nav-item').on('click', function(e) {
        const tab = $(this).data('tab');
        if (!tab) return; // e.g. logout link - let browser navigate

        e.preventDefault();

        $('.profile-nav-item').removeClass('active');
        $(this).addClass('active');


        $('.profile-tab').removeClass('active');
        if (tab === 'info') {
            $('#infoTab').addClass('active');
        } else if (tab === 'orders') {
            $('#ordersTab').addClass('active');
            loadOrders();
        } else if (tab === 'password') {
            $('#passwordTab').addClass('active');
        }
    });


    setupPasswordToggle('#currentPasswordToggle', '#current_password');
    setupPasswordToggle('#newPasswordToggle', '#new_password');
    setupPasswordToggle('#confirmPasswordToggle', '#confirm_password');


    $('#confirm_password').on('input', function() {
        const newPassword = $('#new_password').val();
        const confirmPassword = $(this).val();
        const $input = $(this);
        
        if (confirmPassword.length > 0) {
            if (newPassword !== confirmPassword) {
                $input[0].setCustomValidity('Mật khẩu xác nhận không khớp');
            } else {
                $input[0].setCustomValidity('');
            }
        } else {
            $input[0].setCustomValidity('');
        }
    });


    $('#changePasswordForm').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $btn = $('#changePasswordBtn');
        const $btnText = $btn.find('.btn-text');
        const $btnLoading = $btn.find('.btn-loading');
        const $message = $('#changePasswordMessage');
        

        $message.hide().removeClass('success error').text('');
        

        const newPassword = $('#new_password').val();
        const confirmPassword = $('#confirm_password').val();
        
        if (newPassword !== confirmPassword) {
            showSnackBar('failed', 'Mật khẩu xác nhận không khớp');
            return;
        }
        

        $btn.prop('disabled', true);
        $btnText.hide();
        $btnLoading.show();
        

        const formData = {
            current_password: $('#current_password').val(),
            new_password: newPassword,
            confirm_password: confirmPassword
        };
        

        $.ajax({
            url: '/api/auth/change-password',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showSnackBar('success', response.message || 'Đổi mật khẩu thành công!');
                    $form[0].reset();
                    setTimeout(function() {
                        $btn.prop('disabled', false);
                        $btnText.show();
                        $btnLoading.hide();
                    }, 2000);
                } else {
                    var msg = response.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
                    var type = (msg.indexOf('phải khác mật khẩu hiện tại') !== -1) ? 'warm' : 'failed';
                    showSnackBar(type, msg);
                    $btn.prop('disabled', false);
                    $btnText.show();
                    $btnLoading.hide();
                }
            },
            error: function(xhr, status, error) {
                console.error('Change password error:', error);
                var errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
                if (xhr.responseText) {
                    try {
                        var errorResponse = JSON.parse(xhr.responseText);
                        if (errorResponse.message) errorMessage = errorResponse.message;
                    } catch (e) {}
                }
                showSnackBar('failed', errorMessage);
                $btn.prop('disabled', false);
                $btnText.show();
                $btnLoading.hide();
            }
        });
    });


    $('#updateProfileForm').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const $btn = $('#updateProfileBtn');
        const $btnText = $btn.find('.btn-text');
        const $btnLoading = $btn.find('.btn-loading');
        const $message = $('#updateProfileMessage');
        

        $message.hide().removeClass('success error').text('');
        

        $btn.prop('disabled', true);
        $btnText.hide();
        $btnLoading.show();
        

        const formData = {
            gioi_tinh: $('#gioi_tinh').val() || null,
            email: $('#email').val().trim() || null,
            dien_thoai: $('#dien_thoai').val().trim() || null,
            dia_chi: $('#dia_chi').val().trim() || null
        };
        

        $.ajax({
            url: '/api/auth/update-profile',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showSnackBar('success', response.message || 'Cập nhật thông tin thành công!');
                    setTimeout(function() { window.location.reload(); }, 1500);
                } else {
                    var msg = response.message || 'Cập nhật thông tin thất bại. Vui lòng thử lại.';
                    var type = (msg.indexOf('Không có thông tin nào') !== -1) ? 'warm' : 'failed';
                    showSnackBar(type, msg);
                    $btn.prop('disabled', false);
                    $btnText.show();
                    $btnLoading.hide();
                }
            },
            error: function(xhr, status, error) {
                console.error('Update profile error:', error);
                var errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
                if (xhr.responseText) {
                    try {
                        var errorResponse = JSON.parse(xhr.responseText);
                        if (errorResponse.message) errorMessage = errorResponse.message;
                    } catch (e) {}
                }
                showSnackBar('failed', errorMessage);
                $btn.prop('disabled', false);
                $btnText.show();
                $btnLoading.hide();
            }
        });
    });


    $('#orderStatusFilter, #orderDaysFilter').on('change', function() {
        loadOrders(1);
    });


    $('#orderDetailModal .order-detail-overlay, #orderDetailModal .order-detail-close').on('click', function() {
        $('#orderDetailModal').hide();
    });
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#orderDetailModal').is(':visible')) {
            $('#orderDetailModal').hide();
        }
    });


    function loadOrders(page) {
        page = page || 1;
        var $loading = $('#ordersLoading');
        var $empty = $('#ordersEmpty');
        var $list = $('#ordersList');
        var $pagination = $('#ordersPagination');

        $loading.show();
        $empty.hide();
        $list.hide();
        $pagination.hide();

        var params = {
            page: page,
            per_page: 10,
            status: $('#orderStatusFilter').val() || '',
            days: $('#orderDaysFilter').val() || 30
        };

        $.ajax({
            url: '/api/order/get',
            method: 'GET',
            data: { page: params.page, per_page: params.per_page, status: params.status, days: params.days },
            dataType: 'json',
            success: function(res) {
                $loading.hide();
                if (res.success && res.orders && res.orders.length > 0) {
                    renderOrders(res.orders);
                    renderOrdersPagination(res);
                    $list.show();
                    if (res.total_pages > 1) {
                        $pagination.show();
                    }
                } else {
                    $empty.show();
                }
            },
            error: function(xhr, status, err) {
                console.error('Load orders error:', err);
                $loading.hide();
                $empty.show();
            }
        });
    }


    function renderOrders(orders) {
        var $list = $('#ordersList');
        $list.empty();
        orders.forEach(function(o) {
            var dateTime = (o.NgayTaoFormatted || '') + ' | ' + (o.NgayTaoTime || '');
            var statusClass = getStatusClass(o.TrangThai);
            var statusText = getStatusText(o.TrangThai);
            var card = $('<div class="order-card order-card-compact">')
                .append(
                    '<div class="order-card-header">' +
                    '<span class="order-status-badge status-' + statusClass + '">' + escapeHtml(statusText) + '</span>' +
                    '</div>' +
                    '<div class="order-card-body">' +
                    '<h3 class="order-card-code">Mã đơn ' + escapeHtml(o.OrderCode) + '</h3>' +
                    '<p class="order-card-date">' + escapeHtml(dateTime) + '</p>' +
                    '<p class="order-card-store">Cửa hàng: ' + escapeHtml(o.TenStore) + '</p>' +
                    '<p class="order-card-qty">Số lượng: ' + (o.ItemCount || 0) + ' Sản phẩm</p>' +
                    '<div class="order-card-footer">' +
                    '<a href="#" class="order-card-detail-link" data-order-id="' + o.MaOrder + '">Xem chi tiết</a>' +
                    '<span class="order-card-total">Tổng tiền: ' + formatCurrency(o.TongTien) + '</span>' +
                    '</div>' +
                    '</div>'
                );
            $list.append(card);
        });
        $list.find('.order-card-detail-link').on('click', function(e) {
            e.preventDefault();
            openOrderDetail(parseInt($(this).data('order-id'), 10));
        });
    }


    function renderOrdersPagination(res) {
        var total = res.total || 0;
        var totalPages = res.total_pages || 1;
        var page = res.page || 1;
        var $p = $('#ordersPagination');
        $p.empty();
        if (totalPages <= 1) return;

        var start = Math.max(1, page - 2);
        var end = Math.min(totalPages, page + 2);
        var nums = '';
        for (var i = start; i <= end; i++) {
            nums += '<button type="button" class="pagination-number' + (i === page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        var html = '<div class="orders-pagination-inner">' +
            '<p class="pagination-info">Trang ' + page + ' trên ' + totalPages + '</p>' +
            '<div class="pagination-controls">' +
            '<button type="button" class="pagination-arrow" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>&lt;</button>' +
            '<div class="pagination-numbers">' + nums + '</div>' +
            '<button type="button" class="pagination-arrow" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>&gt;</button>' +
            '</div>' +
            '</div>';
        $p.html(html);
        $p.find('.pagination-number, .pagination-arrow').on('click', function() {
            var p = parseInt($(this).data('page'), 10);
            if (p >= 1 && p <= totalPages) loadOrders(p);
        });
    }


    function openOrderDetail(orderId) {
        var $modal = $('#orderDetailModal');
        var $body = $('#orderDetailBody');
        $body.html('<div class="order-detail-loading">Đang tải...</div>');
        $modal.show();

        $.ajax({
            url: '/order-detail-view',
            method: 'GET',
            data: { id: orderId },
            success: function(html) {
                $body.html(html);

                initCollapsibleSections();
            },
            error: function() {
                showSnackBar('failed', 'Có lỗi xảy ra. Vui lòng thử lại.');
                $body.html('<p class="order-detail-error">Có lỗi xảy ra. Vui lòng thử lại.</p>');
            }
        });
    }
    

    function initCollapsibleSections() {
        $('#orderDetailBody').off('click', '.order-detail-section.collapsible .order-detail-section-title');
        $('#orderDetailBody').on('click', '.order-detail-section.collapsible .order-detail-section-title', function() {
            var $section = $(this).closest('.order-detail-section');
            $section.toggleClass('collapsed');
        });
    }


    function getStatusClass(status) {
        var s = (status || '').toLowerCase();
        if (s === 'completed') return 'completed';
        if (s === 'cancelled' || s === 'store_cancelled') return 'cancelled';
        if (s === 'delivering') return 'delivering';
        if (s === 'processing' || s === 'order_received') return 'received';
        if (s === 'payment_received' || s === 'pending') return 'payment-received';
        return 'payment-received';
    }

    function getStatusText(status) {
        var s = (status || '').toLowerCase();
        if (s === 'completed') return 'Hoàn thành';
        if (s === 'cancelled' || s === 'store_cancelled') return 'Hủy đơn';
        if (s === 'delivering') return 'Đang vận chuyển';
        if (s === 'processing' || s === 'order_received') return 'Đã nhận đơn';
        if (s === 'payment_received' || s === 'pending') return 'Đã nhận thanh toán';
        return 'Đã nhận thanh toán';
    }
});
