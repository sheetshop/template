import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import { SearchIcon, ShoppingBagIcon, XIcon } from '@heroicons/react/outline';
import { ChevronDownIcon, PlusSmIcon } from '@heroicons/react/solid';
import { Dialog, Disclosure, Transition } from '@headlessui/react';
import db from '~/utils/db';
import invariant from 'tiny-invariant';

export const getStaticProps: GetServerSideProps = async context => {
  invariant(process.env.SHOP_ID, 'process.env.SHOP_ID is not defined');
  const shop = db
    .prepare('SELECT id,name,brand_color,logo_asset,stripe_account_id FROM shops WHERE id = ?')
    .get(process.env.SHOP_ID);

  invariant(shop, 'process.env.SHOP_ID is not valid');

  const productsAndAssets = db
    .prepare(
      `SELECT products.id, products.sort_key, products.name, products.price_formatted, assets.id AS asset_id, assets.width AS asset_width, assets.height AS asset_height, assets.data_placeholder AS asset_data_placeholder
      FROM products LEFT JOIN assets ON assets.product_id = products.id AND assets.data_type = 'image/webp' WHERE products.shop_id = ? ORDER BY products.sort_key, assets.sort_key`
    )
    .all(shop.id);

  const products = productsAndAssets.reduce((acc, product) => {
    if (acc[product.sort_key]) {
      // second+ asset for a product
      const { asset_id, asset_width, asset_height, asset_data_placeholder } = product;
      acc[product.sort_key].assets.push({
        id: asset_id,
        width: asset_width,
        height: asset_height,
        dataPlaceholder: `data:image/webp;base64,${Buffer.from(asset_data_placeholder).toString(
          'base64'
        )}`
      });
    } else {
      const { asset_id, asset_width, asset_height, asset_data_placeholder, ...restProduct } =
        product;

      acc[product.sort_key] = restProduct;

      if (asset_id) {
        acc[product.sort_key].assets = [
          {
            id: asset_id,
            width: asset_width,
            height: asset_height,
            dataPlaceholder: `data:image/webp;base64,${Buffer.from(asset_data_placeholder).toString(
              'base64'
            )}`
          }
        ];
      }
    }

    return acc;
  }, {});

  console.log('shop', shop, products);

  return {
    props: {
      shop,
      products: Object.keys(products)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map(sort_key => products[sort_key])
    }
  };
};

const Home: NextPage<{
  shop: {
    id: string;
    name: string;
    brand_color: string;
    logo_asset: string;
    stripe_account_id: string;
  };
  products: {
    id: string;
    name: string;
    price_formatted?: string | null;
    description?: string | null;
    assets: { id: string; width: number; height: number; dataPlaceholder: string }[];
  }[];
}> = ({ shop, products }) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  return (
    <div className="bg-white">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <header className="relative bg-white">
          <p className="flex items-center justify-center h-10 px-4 text-sm font-medium text-white bg-indigo-600 sm:px-6 lg:px-8">
            Get free delivery on orders over $100
          </p>

          <nav aria-label="Top" className="px-4 border-b border-gray-200 sm:px-6 lg:px-8">
            <div>
              <div className="flex items-center h-16">
                {/* Logo */}
                <div className="flex ml-4 lg:ml-0">
                  <a href="#">
                    <span className="sr-only">Workflow</span>
                    <img
                      className="w-auto h-8"
                      src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=600"
                      alt=""
                    />
                  </a>
                </div>

                <div className="flex items-center ml-auto">
                  <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
                    <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-800">
                      Sign in
                    </a>
                    <span className="w-px h-6 bg-gray-200" aria-hidden="true" />
                    <a href="#" className="text-sm font-medium text-gray-700 hover:text-gray-800">
                      Create account
                    </a>
                  </div>

                  <div className="hidden lg:ml-8 lg:flex">
                    <a href="#" className="flex items-center text-gray-700 hover:text-gray-800">
                      <img
                        src="https://tailwindui.com/img/flags/flag-canada.svg"
                        alt=""
                        className="flex-shrink-0 block w-5 h-auto"
                      />
                      <span className="block ml-3 text-sm font-medium">CAD</span>
                      <span className="sr-only">, change currency</span>
                    </a>
                  </div>

                  {/* Search */}
                  <div className="flex lg:ml-6">
                    <a href="#" className="p-2 text-gray-400 hover:text-gray-500">
                      <span className="sr-only">Search</span>
                      <SearchIcon className="w-6 h-6" aria-hidden="true" />
                    </a>
                  </div>

                  {/* Cart */}
                  <div className="flow-root ml-4 lg:ml-6">
                    <a href="#" className="flex items-center p-2 -m-2 group">
                      <ShoppingBagIcon
                        className="flex-shrink-0 w-6 h-6 text-gray-400 group-hover:text-gray-500"
                        aria-hidden="true"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                        0
                      </span>
                      <span className="sr-only">items in cart, view bag</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>
      </div>

      <div>
        {/* Mobile filter dialog */}
        <Transition.Root show={mobileFiltersOpen} as={Fragment}>
          <Dialog as="div" className="relative z-40 lg:hidden" onClose={setMobileFiltersOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 z-40 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full">
                <Dialog.Panel className="relative flex flex-col w-full h-full max-w-xs py-4 pb-6 ml-auto overflow-y-auto bg-white shadow-xl">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                    <button
                      type="button"
                      className="flex items-center justify-center w-10 h-10 p-2 -mr-2 text-gray-400 hover:text-gray-500"
                      onClick={() => setMobileFiltersOpen(false)}>
                      <span className="sr-only">Close menu</span>
                      <XIcon className="w-6 h-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Filters */}
                  <form className="mt-4">
                    {filters.map(section => (
                      <Disclosure
                        as="div"
                        key={section.name}
                        className="pt-4 pb-4 border-t border-gray-200">
                        {({ open }) => (
                          <fieldset>
                            <legend className="w-full px-2">
                              <Disclosure.Button className="flex items-center justify-between w-full p-2 text-gray-400 hover:text-gray-500">
                                <span className="text-sm font-medium text-gray-900">
                                  {section.name}
                                </span>
                                <span className="flex items-center ml-6 h-7">
                                  <ChevronDownIcon
                                    className={`${
                                      open ? '-rotate-180' : 'rotate-0'
                                    } h-5 w-5 transform`}
                                    aria-hidden="true"
                                  />
                                </span>
                              </Disclosure.Button>
                            </legend>
                            <Disclosure.Panel className="px-4 pt-4 pb-2">
                              <div className="space-y-6">
                                {section.options.map((option, optionIdx) => (
                                  <div key={option.value} className="flex items-center">
                                    <input
                                      id={`${section.id}-${optionIdx}-mobile`}
                                      name={`${section.id}[]`}
                                      defaultValue={option.value}
                                      type="checkbox"
                                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label
                                      htmlFor={`${section.id}-${optionIdx}-mobile`}
                                      className="ml-3 text-sm text-gray-500">
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </Disclosure.Panel>
                          </fieldset>
                        )}
                      </Disclosure>
                    ))}
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        <div className="border-b border-gray-200">
          <nav aria-label="Breadcrumb" className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <ol role="list" className="flex items-center py-4 space-x-4">
              {breadcrumbs.map(breadcrumb => (
                <li key={breadcrumb.id}>
                  <div className="flex items-center">
                    <a href={breadcrumb.href} className="mr-4 text-sm font-medium text-gray-900">
                      {breadcrumb.name}
                    </a>
                    <svg
                      viewBox="0 0 6 20"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      className="w-auto h-5 text-gray-300">
                      <path
                        d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </li>
              ))}
              <li className="text-sm">
                <a
                  href="#"
                  aria-current="page"
                  className="font-medium text-gray-500 hover:text-gray-600">
                  New Arrivals
                </a>
              </li>
            </ol>
          </nav>
        </div>

        <main className="max-w-2xl px-4 mx-auto lg:max-w-7xl lg:px-8">
          <div className="pt-24 pb-10 border-b border-gray-200">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">New Arrivals</h1>
            <p className="mt-4 text-base text-gray-500">
              Checkout out the latest release of Basic Tees, new and improved with four openings!
            </p>
          </div>

          <div className="pt-12 pb-24 lg:grid lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
            <aside>
              <h2 className="sr-only">Filters</h2>

              <button
                type="button"
                className="inline-flex items-center lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}>
                <span className="text-sm font-medium text-gray-700">Filters</span>
                <PlusSmIcon
                  className="flex-shrink-0 w-5 h-5 ml-1 text-gray-400"
                  aria-hidden="true"
                />
              </button>

              <div className="hidden lg:block">
                <form className="space-y-10 divide-y divide-gray-200">
                  {filters.map((section, sectionIdx) => (
                    <div key={section.name} className={sectionIdx === 0 ? undefined : 'pt-10'}>
                      <fieldset>
                        <legend className="block text-sm font-medium text-gray-900">
                          {section.name}
                        </legend>
                        <div className="pt-6 space-y-3">
                          {section.options.map((option, optionIdx) => (
                            <div key={option.value} className="flex items-center">
                              <input
                                id={`${section.id}-${optionIdx}`}
                                name={`${section.id}[]`}
                                defaultValue={option.value}
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <label
                                htmlFor={`${section.id}-${optionIdx}`}
                                className="ml-3 text-sm text-gray-600">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  ))}
                </form>
              </div>
            </aside>

            <section
              aria-labelledby="product-heading"
              className="mt-6 lg:mt-0 lg:col-span-2 xl:col-span-3">
              <h2 id="product-heading" className="sr-only">
                Products
              </h2>

              <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:gap-x-8 xl:grid-cols-3">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="relative flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg group">
                    <div className="relative w-full h-48 bg-gray-200 group-hover:opacity-75">
                      {product.assets?.[0] ? (
                        <Image
                          src={`/assets/${product.assets[0].id}.webp`}
                          alt=""
                          width={product.assets[0].width}
                          height={product.assets[0].height}
                          layout="fill"
                          blurDataURL={product.assets[0].dataPlaceholder}
                          placeholder="blur"
                          className="object-cover object-center"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-col flex-1 p-4 space-y-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        <a href="#">
                          <span aria-hidden="true" className="absolute inset-0" />
                          {product.name}
                        </a>
                      </h3>
                      <p className="text-sm text-gray-500">{product.description}</p>
                      <div className="flex flex-col justify-end flex-1">
                        {/* <p className="text-sm italic text-gray-500">{product.options}</p> */}
                        <p className="text-base font-medium text-gray-900">
                          {product.price_formatted}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        <footer aria-labelledby="footer-heading" className="bg-white border-t border-gray-200">
          <h2 id="footer-heading" className="sr-only">
            Footer
          </h2>
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="py-20">
              <div className="grid grid-cols-1 md:grid-cols-12 md:grid-flow-col md:gap-x-8 md:gap-y-16 md:auto-rows-min">
                {/* Image section */}
                <div className="col-span-1 md:col-span-2 lg:row-start-1 lg:col-start-1">
                  <img
                    src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=600"
                    alt=""
                    className="w-auto h-8"
                  />
                </div>

                {/* Sitemap sections */}
                <div className="grid grid-cols-2 col-span-6 gap-8 mt-10 sm:grid-cols-3 md:mt-0 md:row-start-1 md:col-start-3 md:col-span-8 lg:col-start-2 lg:col-span-6">
                  <div className="grid grid-cols-1 gap-y-12 sm:col-span-2 sm:grid-cols-2 sm:gap-x-8">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Products</h3>
                      <ul role="list" className="mt-6 space-y-6">
                        {footerNavigation.products.map(item => (
                          <li key={item.name} className="text-sm">
                            <a href={item.href} className="text-gray-500 hover:text-gray-600">
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Company</h3>
                      <ul role="list" className="mt-6 space-y-6">
                        {footerNavigation.company.map(item => (
                          <li key={item.name} className="text-sm">
                            <a href={item.href} className="text-gray-500 hover:text-gray-600">
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Customer Service</h3>
                    <ul role="list" className="mt-6 space-y-6">
                      {footerNavigation.customerService.map(item => (
                        <li key={item.name} className="text-sm">
                          <a href={item.href} className="text-gray-500 hover:text-gray-600">
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Newsletter section */}
                <div className="mt-12 md:mt-0 md:row-start-2 md:col-start-3 md:col-span-8 lg:row-start-1 lg:col-start-9 lg:col-span-4">
                  <h3 className="text-sm font-medium text-gray-900">Sign up for our newsletter</h3>
                  <p className="mt-6 text-sm text-gray-500">
                    The latest deals and savings, sent to your inbox weekly.
                  </p>
                  <form className="flex mt-2 sm:max-w-md">
                    <label htmlFor="email-address" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email-address"
                      type="text"
                      autoComplete="email"
                      required
                      className="w-full min-w-0 px-4 py-2 text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex-shrink-0 ml-4">
                      <button
                        type="submit"
                        className="flex items-center justify-center w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Sign up
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="py-10 text-center border-t border-gray-100">
              <p className="text-sm text-gray-500">
                &copy; 2021 Workflow, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;

const navigation = {
  categories: [
    {
      id: 'women',
      name: 'Women',
      featured: [
        {
          name: 'New Arrivals',
          href: '#',
          imageSrc: 'https://tailwindui.com/img/ecommerce-images/mega-menu-category-01.jpg',
          imageAlt: 'Models sitting back to back, wearing Basic Tee in black and bone.'
        },
        {
          name: 'Basic Tees',
          href: '#',
          imageSrc: 'https://tailwindui.com/img/ecommerce-images/mega-menu-category-02.jpg',
          imageAlt:
            'Close up of Basic Tee fall bundle with off-white, ochre, olive, and black tees.'
        }
      ],
      sections: [
        {
          id: 'clothing',
          name: 'Clothing',
          items: [
            { name: 'Tops', href: '#' },
            { name: 'Dresses', href: '#' },
            { name: 'Pants', href: '#' },
            { name: 'Denim', href: '#' },
            { name: 'Sweaters', href: '#' },
            { name: 'T-Shirts', href: '#' },
            { name: 'Jackets', href: '#' },
            { name: 'Activewear', href: '#' },
            { name: 'Browse All', href: '#' }
          ]
        },
        {
          id: 'accessories',
          name: 'Accessories',
          items: [
            { name: 'Watches', href: '#' },
            { name: 'Wallets', href: '#' },
            { name: 'Bags', href: '#' },
            { name: 'Sunglasses', href: '#' },
            { name: 'Hats', href: '#' },
            { name: 'Belts', href: '#' }
          ]
        },
        {
          id: 'brands',
          name: 'Brands',
          items: [
            { name: 'Full Nelson', href: '#' },
            { name: 'My Way', href: '#' },
            { name: 'Re-Arranged', href: '#' },
            { name: 'Counterfeit', href: '#' },
            { name: 'Significant Other', href: '#' }
          ]
        }
      ]
    },
    {
      id: 'men',
      name: 'Men',
      featured: [
        {
          name: 'New Arrivals',
          href: '#',
          imageSrc:
            'https://tailwindui.com/img/ecommerce-images/product-page-04-detail-product-shot-01.jpg',
          imageAlt: 'Drawstring top with elastic loop closure and textured interior padding.'
        },
        {
          name: 'Artwork Tees',
          href: '#',
          imageSrc:
            'https://tailwindui.com/img/ecommerce-images/category-page-02-image-card-06.jpg',
          imageAlt:
            'Three shirts in gray, white, and blue arranged on table with same line drawing of hands and shapes overlapping on front of shirt.'
        }
      ],
      sections: [
        {
          id: 'clothing',
          name: 'Clothing',
          items: [
            { name: 'Tops', href: '#' },
            { name: 'Pants', href: '#' },
            { name: 'Sweaters', href: '#' },
            { name: 'T-Shirts', href: '#' },
            { name: 'Jackets', href: '#' },
            { name: 'Activewear', href: '#' },
            { name: 'Browse All', href: '#' }
          ]
        },
        {
          id: 'accessories',
          name: 'Accessories',
          items: [
            { name: 'Watches', href: '#' },
            { name: 'Wallets', href: '#' },
            { name: 'Bags', href: '#' },
            { name: 'Sunglasses', href: '#' },
            { name: 'Hats', href: '#' },
            { name: 'Belts', href: '#' }
          ]
        },
        {
          id: 'brands',
          name: 'Brands',
          items: [
            { name: 'Re-Arranged', href: '#' },
            { name: 'Counterfeit', href: '#' },
            { name: 'Full Nelson', href: '#' },
            { name: 'My Way', href: '#' }
          ]
        }
      ]
    }
  ],
  pages: [
    { name: 'Company', href: '#' },
    { name: 'Stores', href: '#' }
  ]
};
const breadcrumbs = [{ id: 1, name: 'Men', href: '#' }];
const filters = [
  {
    id: 'color',
    name: 'Color',
    options: [
      { value: 'white', label: 'White' },
      { value: 'beige', label: 'Beige' },
      { value: 'blue', label: 'Blue' },
      { value: 'brown', label: 'Brown' },
      { value: 'green', label: 'Green' },
      { value: 'purple', label: 'Purple' }
    ]
  },
  {
    id: 'category',
    name: 'Category',
    options: [
      { value: 'new-arrivals', label: 'All New Arrivals' },
      { value: 'tees', label: 'Tees' },
      { value: 'crewnecks', label: 'Crewnecks' },
      { value: 'sweatshirts', label: 'Sweatshirts' },
      { value: 'pants-shorts', label: 'Pants & Shorts' }
    ]
  },
  {
    id: 'sizes',
    name: 'Sizes',
    options: [
      { value: 'xs', label: 'XS' },
      { value: 's', label: 'S' },
      { value: 'm', label: 'M' },
      { value: 'l', label: 'L' },
      { value: 'xl', label: 'XL' },
      { value: '2xl', label: '2XL' }
    ]
  }
];

const footerNavigation = {
  products: [
    { name: 'Bags', href: '#' },
    { name: 'Tees', href: '#' },
    { name: 'Objects', href: '#' },
    { name: 'Home Goods', href: '#' },
    { name: 'Accessories', href: '#' }
  ],
  company: [
    { name: 'Who we are', href: '#' },
    { name: 'Sustainability', href: '#' },
    { name: 'Press', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Terms & Conditions', href: '#' },
    { name: 'Privacy', href: '#' }
  ],
  customerService: [
    { name: 'Contact', href: '#' },
    { name: 'Shipping', href: '#' },
    { name: 'Returns', href: '#' },
    { name: 'Warranty', href: '#' },
    { name: 'Secure Payments', href: '#' },
    { name: 'FAQ', href: '#' },
    { name: 'Find a store', href: '#' }
  ]
};
