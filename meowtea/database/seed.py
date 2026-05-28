from datetime import datetime

from ..extensions import db
from ..models import (
    Category,
    News,
    OptionGroup,
    OptionValue,
    PaymentMethod,
    ProductOptionGroup,
    ProductOptionValue,
    Promotion,
    Role,
    SanPham,
    Store,
    User,
    UserStore,
)


EXPECTED_SEED_COUNTS = {
    Role: 3,
    Store: 12,
    User: 3,
    UserStore: 1,
    Category: 4,
    OptionGroup: 3,
    OptionValue: 12,
    SanPham: 16,
    ProductOptionGroup: 40,
    ProductOptionValue: 152,
    PaymentMethod: 4,
    Promotion: 2,
    News: 4,
}


def seed_product_option_values(links: list[tuple[int, int]], values_by_group: dict[int, list[int]]) -> None:
    rows = [
        ProductOptionValue(MaSP=product_id, MaOptionValue=option_value_id)
        for product_id, group_id in links
        for option_value_id in values_by_group.get(group_id, [])
    ]
    db.session.add_all(rows)
    db.session.commit()


def seed_database():
    if Role.query.first():
        return

    db.session.add_all(
        [
            Role(TenRole="Admin"),
            Role(TenRole="Staff"),
            Role(TenRole="Customer"),
        ]
    )
    db.session.commit()

    stores = [
        ("Đồng Khởi", "91 Đồng Khởi, Bến Nghé, Quận 1, Thành Phố Hồ Chí Minh", "033492824"),
        ("Cộng Hòa", "123 Cộng Hòa, Phường 12, Tân Bình, Thành Phố Hồ Chí Minh", "033492825"),
        ("Điện Biên Phủ", "456 Điện Biên Phủ, Phường 25, Bình Thạnh, Thành Phố Hồ Chí Minh", "033492826"),
        ("Nguyễn Huệ", "789 Nguyễn Huệ, Bến Nghé, Quận 1, Thành Phố Hồ Chí Minh", "033492827"),
        ("Lê Văn Việt", "321 Lê Văn Việt, Hiệp Phú, Quận 9, Thành Phố Hồ Chí Minh", "033492828"),
        ("Cầu Giấy", "45 Cầu Giấy, Quận Cầu Giấy, Hà Nội", "033492829"),
        ("Hoàn Kiếm", "67 Phố Hàng Bông, Hoàn Kiếm, Hà Nội", "033492830"),
        ("Ba Đình", "89 Nguyễn Trãi, Nguyễn Trung Trực, Ba Đình, Hà Nội", "033492831"),
        ("Đống Đa", "234 Tây Sơn, Trung Liệt, Đống Đa, Hà Nội", "033492832"),
        ("Ninh Kiều", "123 Trần Hưng Đạo, Tân An, Ninh Kiều, Cần Thơ", "033492833"),
        ("Cái Răng", "456 Nguyễn Văn Cừ, Lê Bình, Cái Răng, Cần Thơ", "033492834"),
        ("Hải Châu", "789 Trần Phú, Hải Châu 1, Hải Châu, Đà Nẵng", "033492835"),
    ]
    db.session.add_all([Store(TenStore=name, DiaChi=address, DienThoai=phone, TrangThai=1) for name, address, phone in stores])
    db.session.commit()

    db.session.add_all(
        [
            User(Username="admin", Password="admin", Ho="Nguyễn", Ten="Quản Lý", GioiTinh="M", DienThoai="0912345678", Email="admin@shop.com", TrangThai=1, MaRole=1),
            User(Username="staff", Password="staff", Ho="Trần", Ten="Nhân Viên", GioiTinh="F", DienThoai="0987654321", Email="staff1@shop.com", TrangThai=1, MaRole=2),
            User(Username="cust", Password="cust", Ho="Lê", Ten="Khách Hàng", GioiTinh="M", DienThoai="0911223344", Email="customer@gmail.com", TrangThai=1, MaRole=3, DiaChi="Số 07 đường Nguyễn Bỉnh Khiêm, phường Bến Nghé, quận 1, TP Hồ Chí Minh"),
        ]
    )
    db.session.commit()
    db.session.add(UserStore(MaUser=2, MaStore=1))
    db.session.commit()

    db.session.add_all(
        [
            Category(TenCategory="Cà phê truyền thống", TrangThai=1),
            Category(TenCategory="Trà sữa", TrangThai=1),
            Category(TenCategory="Trà trái cây", TrangThai=1),
            Category(TenCategory="Yogurt", TrangThai=1),
        ]
    )
    db.session.commit()

    db.session.add_all(
        [
            OptionGroup(TenNhom="Mức đường", IsMultiple=0),
            OptionGroup(TenNhom="Mức đá", IsMultiple=0),
            OptionGroup(TenNhom="Topping", IsMultiple=1),
        ]
    )
    db.session.commit()

    db.session.add_all(
        [
            OptionValue(TenGiaTri="100% Đường", GiaThem=0, MaOptionGroup=1),
            OptionValue(TenGiaTri="70% Đường", GiaThem=0, MaOptionGroup=1),
            OptionValue(TenGiaTri="50% Đường", GiaThem=0, MaOptionGroup=1),
            OptionValue(TenGiaTri="Không đường", GiaThem=0, MaOptionGroup=1),
            OptionValue(TenGiaTri="100% Đá", GiaThem=0, MaOptionGroup=2),
            OptionValue(TenGiaTri="50% Đá", GiaThem=0, MaOptionGroup=2),
            OptionValue(TenGiaTri="Không đá", GiaThem=0, MaOptionGroup=2),
            OptionValue(TenGiaTri="Trân châu đen", GiaThem=5000, HinhAnh="assets/img/products/topping/topping-tranchau.png", MaOptionGroup=3),
            OptionValue(TenGiaTri="Thạch dừa", GiaThem=5000, HinhAnh="assets/img/products/topping/topping-thachdua.png", MaOptionGroup=3),
            OptionValue(TenGiaTri="Pudding trứng", GiaThem=10000, HinhAnh="assets/img/products/topping/topping-pudding.png", MaOptionGroup=3),
            OptionValue(TenGiaTri="Sương sáo", GiaThem=5000, HinhAnh="assets/img/products/topping/topping-suongsao.png", MaOptionGroup=3),
            OptionValue(TenGiaTri="Củ năng", GiaThem=5000, HinhAnh="assets/img/products/topping/toppingcunang.png", MaOptionGroup=3),
        ]
    )
    db.session.commit()

    products = [
        ("Cà phê Cappuccino", 38000, 45000, "assets/img/products/caphe/caphe-cappucchino.png", 4.65, 245, 1),
        ("Cà phê đen truyền thống", 27000, 30000, "assets/img/products/caphe/caphe-dentruyenthong.png", 4.50, 328, 1),
        ("Cà phê muối", 39000, 42000, "assets/img/products/caphe/caphe-muoi.png", 4.75, 189, 1),
        ("Cà phê sữa đá", 29000, 34000, "assets/img/products/caphe/caphe-suada.png", 4.80, 456, 1),
        ("Trà sữa Dâu Tây", 45000, 50000, "assets/img/products/trasua/trasua-dautay.png", 4.85, 512, 2),
        ("Trà sữa Flan", 49000, 52000, "assets/img/products/trasua/trasua-flan.png", 4.90, 645, 2),
        ("Trà sữa Matcha", 48000, 50000, "assets/img/products/trasua/trasua-mathca.png", 4.70, 432, 2),
        ("Trà sữa Socola", 38000, 48000, "assets/img/products/trasua/trasua-socola.png", 4.65, 298, 2),
        ("Trà sữa Thái Xanh", 45000, 49000, "assets/img/products/trasua/trasua-thaixanh.png", 4.75, 356, 2),
        ("Trà sữa Việt Quất", 45000, 50000, "assets/img/products/trasua/trasua-vietquat.png", 4.80, 421, 2),
        ("Trà Đào", 39000, 45000, "assets/img/products/tratraicay/tratc-dao.png", 4.60, 234, 3),
        ("Trà Khóm", 39000, 45000, "assets/img/products/tratraicay/tratc-khom.png", 4.55, 198, 3),
        ("Trà Sen Vàng", 39000, 46000, "assets/img/products/tratraicay/tratc-senvang.png", 4.70, 267, 3),
        ("Trà Vải", 42000, 45000, "assets/img/products/tratraicay/tratc-vai.png", 4.65, 189, 3),
        ("Yogurt Truyền Thống", 38000, 40000, "assets/img/products/yogurt/truyenthong.png", 4.75, 312, 4),
        ("Yogurt Dâu Tây", 40000, 45000, "assets/img/products/yogurt/dautay.png", 4.80, 278, 4),
    ]
    db.session.add_all(
        [
            SanPham(TenSP=name, GiaNiemYet=price, GiaCoBan=base, HinhAnh=image, Rating=rating, SoLuotRating=ratings, MaCategory=category, TrangThai=1)
            for name, price, base, image, rating, ratings, category in products
        ]
    )
    db.session.commit()

    links = [
        (1, 1), (1, 2), (2, 1), (2, 2), (3, 1), (3, 2), (4, 1), (4, 2),
        (5, 1), (5, 2), (5, 3), (6, 1), (6, 2), (6, 3), (7, 1), (7, 2), (7, 3),
        (8, 1), (8, 2), (8, 3), (9, 1), (9, 2), (9, 3), (10, 1), (10, 2), (10, 3),
        (11, 1), (11, 2), (12, 1), (12, 2), (13, 1), (13, 2), (14, 1), (14, 2),
        (15, 1), (15, 2), (15, 3), (16, 1), (16, 2), (16, 3),
    ]
    db.session.add_all([ProductOptionGroup(MaSP=product_id, MaOptionGroup=group_id) for product_id, group_id in links])
    db.session.commit()

    values_by_group: dict[int, list[int]] = {}
    for option_value in OptionValue.query.order_by(OptionValue.MaOptionValue.asc()).all():
        values_by_group.setdefault(option_value.MaOptionGroup, []).append(option_value.MaOptionValue)
    seed_product_option_values(links, values_by_group)

    db.session.add_all([PaymentMethod(TenPayment=name) for name in ["Tiền mặt", "Chuyển khoản", "Momo", "VNPay"]])
    db.session.commit()
    db.session.add_all(
        [
            Promotion(Code="WELCOME10", LoaiGiamGia="Percentage", GiaTri=10, GiaTriToiDa=20000, TrangThai=1),
            Promotion(Code="FIXED5K", LoaiGiamGia="Fixed", GiaTri=5000, TrangThai=1),
        ]
    )
    db.session.commit()
    db.session.add_all(
        [
            News(TieuDe="Những lợi ích tuyệt vời của nước ép trái cây đối với sức khỏe", NoiDung="assets/md/news/1.md", HinhAnh="assets/img/news/news_one.jpg", TrangThai=1, NgayTao=datetime(2024, 12, 24, 10, 0, 0)),
            News(TieuDe="Cà Phê Cappuccino Dừa lần đầu tiên có mặt tại MeowTea Fresh", NoiDung="assets/md/news/2.md", HinhAnh="assets/img/news/news_two.jpg", TrangThai=1, NgayTao=datetime(2024, 12, 5, 10, 0, 0)),
            News(TieuDe="MeowTea Fresh ra mắt dòng sản phẩm Matcha - dấu ấn độc đáo", NoiDung="assets/md/news/3.md", HinhAnh="assets/img/news/news_three.png", TrangThai=1, NgayTao=datetime(2024, 12, 9, 10, 0, 0)),
            News(TieuDe="App Thành Viên MeowTea Fresh chính thức ra mắt trên Android & iOS", NoiDung="assets/md/news/4.md", HinhAnh="assets/img/news/news_banner.jpg", TrangThai=1, NgayTao=datetime(2024, 12, 15, 10, 0, 0)),
        ]
    )
    db.session.commit()
